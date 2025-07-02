from flask import Flask, request, jsonify, send_file, after_this_request
from flask_cors import CORS
from google.cloud import speech_v1p1beta1 as speech
from google.cloud import translate_v2 as translate
from dotenv import load_dotenv
import os
import io
import uuid

load_dotenv()
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
SRT_FOLDER = "subtitles"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SRT_FOLDER, exist_ok=True)

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

if __name__ == "__main__":
    app.run(debug=True, port=5000)