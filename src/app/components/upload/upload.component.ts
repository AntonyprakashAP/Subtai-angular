import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthService } from '../../_service/auth.service';
import { NgxSpinnerComponent, NgxSpinnerService } from 'ngx-spinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-upload',
  imports: [
    HeaderComponent,
    CommonModule,
    NgxSpinnerComponent,
    ToastModule
  ],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
  providers: [AuthService],
})
export class UploadComponent implements OnInit {

  @ViewChild('inputFileRef') inputFileRef!: ElementRef;

  ffmpeg = createFFmpeg({ log: true });
  loading = false;
  videoFile!: File;
  audioBlobUrl: string = '';
  audioBlob!: Blob;
  isUploaded = false;
  video: SafeUrl | null = null;
  isGenerated = false;
  selectedLang: string = '';
  finalVideoUrl: string | null = null;

  languages: string[] = [
    "Arabic-ar", "Bengali-bn", "Chinese-zh", "English-en", "German-de", "Greek-el",
    "Gujarati-gu", "Hindi-hi", "Italian-it", "Japanese-ja", "Kannada-kn", "Korean-ko",
    "Malay-ms", "Malayalam-ml", "Portuguese-pt", "Punjabi-pa", "Romanian-ro",
    "Russian-ru", "Spanish-es", "Tamil-ta", "Telugu-te", "Turkish-tr", "Urdu-ur"
  ];

  constructor(
    private router: Router,
    private subtitleService: AuthService,
    private sanitizer: DomSanitizer,
    private spinner: NgxSpinnerService,
    private messageService: MessageService,
    private http: HttpClient
  ) { }

  async ngOnInit(): Promise<void> {
    if (history !== undefined) {
      const data = history.state.video;
      if (data != null) {
        this.isUploaded = true;
        this.video = URL.createObjectURL(data);
        this.videoFile = data;
        if (this.videoFile != null) {
          await this.convertVideoToAudio();
        }
      }
    }
  }

  async onFileSelected(event: Event) {
    this.isUploaded = true;
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      this.videoFile = input.files[0];
      this.video = URL.createObjectURL(this.videoFile);
      await this.convertVideoToAudio();
    }
  }

  onButtonClick(): void {
    this.inputFileRef.nativeElement.click();
  }

  async loadFFmpeg() {
    if (!this.loading) {
      await this.ffmpeg.load();
      this.loading = true;
    }
  }

  async convertVideoToAudio() {
    this.loading = true;
    this.audioBlobUrl = '';

    if (!this.ffmpeg.isLoaded()) {
      await this.ffmpeg.load();
    }

    const fileName = 'input.mp4';
    const outputName = 'output.mp3';

    this.ffmpeg.FS('writeFile', fileName, await fetchFile(this.videoFile));
    await this.ffmpeg.run('-i', fileName, '-vn', '-acodec', 'libmp3lame', outputName);

    const data = this.ffmpeg.FS('readFile', outputName);
    this.audioBlob = new Blob([data.buffer], { type: 'audio/mpeg' });
    this.audioBlobUrl = URL.createObjectURL(this.audioBlob);

    this.loading = false;
  }

  async handleGenerate() {
    this.loading = true;
    const formData = new FormData();
    formData.append('audio', this.audioBlob, 'audio.mp3');
    formData.append('fr', 'en-US');
    formData.append('to', 'ta');

    try {
      const srtBlob = await this.http.post('http://localhost:5000/transcribe', formData, {
        responseType: 'blob'
      }).toPromise();

      await this.mergeVideoWithSubtitles(srtBlob as Blob);
      this.isGenerated = true;
    } catch (err) {
      console.error('Subtitle generation failed:', err);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Subtitle generation failed' });
    } finally {
      this.loading = false;
    }
  }

  // private async mergeVideoWithSubtitles(srtBlob: Blob) {
  //   if (!this.ffmpeg.isLoaded()) {
  //     await this.ffmpeg.load();
  //   }

  //   const inVid = 'input.mp4';
  //   const inSrt = 'subs.srt';
  //   const inAss = 'converted.ass';
  //   const outVid = 'out.mp4';

  //   this.ffmpeg.FS('writeFile', inVid, await fetchFile(this.videoFile));
  //   this.ffmpeg.FS('writeFile', inSrt, await fetchFile(srtBlob));

  //   // Convert SRT to ASS (more reliable rendering in ffmpeg.wasm)
  //   await this.ffmpeg.run('-i', inSrt, inAss);

  //   await this.ffmpeg.run(
  //     '-i', inVid,
  //     '-vf', `ass=${inAss}`,
  //     '-c:a', 'copy',
  //     outVid
  //   );

  //   const data = this.ffmpeg.FS('readFile', outVid);
  //   const mergedBlob = new Blob([data.buffer], { type: 'video/mp4' });
  //   this.finalVideoUrl = URL.createObjectURL(mergedBlob);

  //   const a = document.createElement('a');
  //   a.href = this.finalVideoUrl;
  //   a.download = 'subtitled-video.mp4';
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);

  //   setTimeout(() => URL.revokeObjectURL(this.finalVideoUrl!), 10000);

  //   this.ffmpeg.FS('unlink', inVid);
  //   this.ffmpeg.FS('unlink', inSrt);
  //   this.ffmpeg.FS('unlink', inAss);
  //   this.ffmpeg.FS('unlink', outVid);
  // }

  private async mergeVideoWithSubtitles(srtBlob: Blob) {
    await this.loadFFmpeg(); //  FFmpeg is loaded

    const inVid = 'input.mp4';
    const inSrt = 'subs.srt';
    const outVid = 'out.mp4';
    const fontPath = 'tmp/Roboto-Regular.ttf'; // Add a font file into /tmp

    // Write the video file and subtitle to the virtual FS
    this.ffmpeg.FS('writeFile', inVid, await fetchFile(this.videoFile));
    this.ffmpeg.FS('writeFile', inSrt, await fetchFile(srtBlob));
    this.ffmpeg.FS('writeFile', fontPath, await fetchFile('/assets/fonts/Roboto-Regular.ttf'));

    // Add subtitles using the correct filter (no need to convert to .ass)
    await this.ffmpeg.run(
      '-i', inVid,
      '-vf', `subtitles=${inSrt}:fontsdir=/tmp:force_style='FontName=Roboto,FontSize=24,PrimaryColour=&H00FFFFFF'`,
      '-c:v', 'libx264', // safer encoder for compatibility
      '-c:a', 'copy',
      outVid
    );

    // Create the final blob and downloadable link
    const data = this.ffmpeg.FS('readFile', outVid);
    const mergedBlob = new Blob([data.buffer], { type: 'video/mp4' });
    this.finalVideoUrl = URL.createObjectURL(mergedBlob);

    const a = document.createElement('a');
    a.href = this.finalVideoUrl;
    a.download = 'subtitled-video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up FS
    this.ffmpeg.FS('unlink', inVid);
    this.ffmpeg.FS('unlink', inSrt);
    this.ffmpeg.FS('unlink', fontPath);
    this.ffmpeg.FS('unlink', outVid);
  }
}
