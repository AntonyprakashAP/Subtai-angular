from flask import Flask, request, jsonify, send_file, after_this_request
from flask_cors import CORS
from google.cloud import speech_v1p1beta1 as speech
from google.cloud import translate_v2 as translate
from dotenv import load_dotenv
import os
import io
import uuid
import subprocess
from flask import Flask, request, jsonify
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy

load_dotenv()
app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:root@localhost:5432/postgres'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

app.config["JWT_SECRET_KEY"] = "subtai1231231123"  


CORS(app, resources={r"/*": {"origins": "http://localhost:4200"}})

UPLOAD_FOLDER = "uploads"
SRT_FOLDER = "subtitles"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SRT_FOLDER, exist_ok=True)



jwt = JWTManager(app)

class UserDetails(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

with app.app_context():
    db.create_all()

@app.route("/register", methods=["POST"])
def register():

    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")

    if not username or not password or not email:
        return jsonify({"msg": "Missing username, password, or email"}), 400

    existing_user_username = UserDetails.query.filter_by(username=username).first()
    existing_user_email = UserDetails.query.filter_by(email=email).first()

    if existing_user_username:
        return jsonify({"msg": "Username already exists"}), 409
    if existing_user_email:
        return jsonify({"msg": "Email already exists"}), 409

    hashed_password = generate_password_hash(password)
    new_user = UserDetails(username=username, email=email, password_hash=hashed_password)

    try:
        db.session.add(new_user)
        db.session.commit()
        # print(f"Registered user: {username}")
        return jsonify({"msg": "User registered successfully"}), 201
    except Exception as e:
        db.session.rollback()
        # print(f"Error during registration: {e}")
        return jsonify({"msg": "An error occurred during registration"}), 500


@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"msg": "Missing username or password"}), 400

    user = UserDetails.query.filter_by(username=username).first()

    if user and check_password_hash(user.password_hash, password):
        # Create an access token for the logged-in user
        access_token = create_access_token(identity=user.username)
        return jsonify(access_token=access_token), 200
    else:
        return jsonify({"msg": "Bad username or password"}), 401

@app.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    """
    A protected route that requires a valid JWT access token.
    """
    # Access the identity of the current user with get_jwt_identity
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user, message="You have access to protected data!"), 200

def seconds_to_srt_time(seconds: float) -> str:
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{hrs:02}:{mins:02}:{secs:02}.{millis:03}"


def create_srt_entry( start_time_str: str, end_time_str: str, text: str) -> str:  #sequence_number: int,
    return f"\n{start_time_str} --> {end_time_str}\n{text}\n\n"
# {sequence_number}

def write_srt_file(filename: str, subtitles_data: list[dict]) -> None:
    with open(filename, "w", encoding="utf-8") as f:

        f.write("WEBVTT")
        f.write("\n\n")  

        for entry in subtitles_data:
            f.write(
                create_srt_entry(
                    # entry["sequence"],
                    entry["start_time"],
                    entry["end_time"],
                    entry["text"],
                )
            )

def transcribe_audio(file_path: str, language_code: str):
    client = speech.SpeechClient()
    with open(file_path, "rb") as audio_file:
        content = audio_file.read()

    audio = speech.RecognitionAudio(content=content)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.MP3,
        sample_rate_hertz=16000,
        language_code=language_code,
        enable_word_time_offsets=True,
        enable_automatic_punctuation=True,
    )
    response = client.recognize(config=config, audio=audio)
    transcript = " ".join([r.alternatives[0].transcript for r in response.results])
    return response.results, transcript


def generate_translated_srt(results, source_lang: str, target_lang: str, *, write_file: bool = False):
    translate_client = translate.Client()
    subtitles: list[dict] = []

    sequence = 1
    for result in results:
        alt = result.alternatives[0]
        if not alt.words:
            continue

        start_time = alt.words[0].start_time.total_seconds()
        end_time = alt.words[-1].end_time.total_seconds()
        start_str = seconds_to_srt_time(start_time)
        end_str = seconds_to_srt_time(end_time)

        translated_text = translate_client.translate(
            alt.transcript.strip(),
            source_language=source_lang,
            target_language=target_lang,
        )["translatedText"]

        subtitles.append(
            {
                # "sequence": sequence,
                "start_time": start_str,
                "end_time": end_str,
                "text": translated_text,
            }
        )
        sequence += 1

    srt_string = "".join(
        create_srt_entry(
             sub["start_time"], sub["end_time"], sub["text"] #sub["sequence"],
        )
        for sub in subtitles
    ).strip()

    srt_path = None
    if write_file:
        srt_filename = f"{uuid.uuid4().hex}.vtt" # if you want use srt file type change here and change the sequence
        srt_path = os.path.join(SRT_FOLDER, srt_filename)
        write_srt_file(srt_path, subtitles)

    return srt_string, srt_path

@app.route('/burn-subtitles', methods=['POST'])
def burn_subtitles():
    video = request.files['video']
    vtt = request.files['subtitle']

    # Generate unique file names
    video_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}.mp4")
    vtt_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}.vtt")
    ass_path = vtt_path.replace('.vtt', '.ass')
    output_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}_output.mp4")

    # Save the uploaded files
    video.save(video_path)
    vtt.save(vtt_path)

    # Convert VTT to ASS
    subprocess.run([
        "ffmpeg", "-y",
        "-i", vtt_path,
        ass_path
    ], check=True)

    # Burn in ASS subtitles
    subprocess.run([
        "ffmpeg", "-y",
        "-i", video_path,
        "-vf", f"ass={ass_path}",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "20",
        "-c:a", "copy",
        output_path
    ], check=True)

    return send_file(output_path, as_attachment=True, download_name="video_with_subtitles.mp4")


@app.route("/transcribe", methods=["POST"])
def transcribe_route():
    audio_file = request.files.get("audio")
    source_lang = request.form.get("fr")
    target_lang = request.form.get("to")

    if not audio_file or not source_lang or not target_lang:
        return jsonify({"error": "Missing audio file or language codes"}), 400

    audio_path = os.path.join(UPLOAD_FOLDER, audio_file.filename)
    audio_file.save(audio_path)

    try:
        results, _ = transcribe_audio(audio_path, source_lang)
        _, srt_path = generate_translated_srt(results, source_lang, target_lang, write_file=True)
        # print("srt_path : ",srt_path,"audio path",audio_path)

        # if srt_path and os.path.exists(srt_path):

        with open(srt_path, 'rb') as f:
            srt_data = f.read()

        @after_this_request
        def cleanup(response):
            try:
                if os.path.exists(audio_path):
                    os.remove(audio_path)

                if os.path.exists(srt_path):
                    os.remove(srt_path)

            except Exception as cleanup_error:
                print(f"Cleanup error: {cleanup_error}")
            return response

        return send_file(
            io.BytesIO(srt_data),
            mimetype='text/plain',
            as_attachment=True,
            download_name=os.path.basename(srt_path)
        )

        # return jsonify({"error": "SRT file generation failed"}), 500

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    return "File too large. Max upload size is 100MB.", 413

if __name__ == "__main__":
    app.run(debug=True, port=5000)