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
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'app-upload',
  imports: [
    HeaderComponent,
    CommonModule,
    NgxSpinnerComponent,
    ToastModule,
    NgxSkeletonLoaderModule
  ],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
  providers: [AuthService],
})
export class UploadComponent implements OnInit {

  @ViewChild('inputFileRef') inputFileRef!: ElementRef;

  ffmpeg = createFFmpeg({
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
  });

  loading = false;
  videoFile!: File;
  audioBlobUrl: string = '';
  audioBlob!: Blob;
  isUploaded = false;
  video: SafeUrl | null = null;
  isGenerated = false;
  fromLang: string = '';
  toLang: string = '';
  finalVideoUrl: string | null = null;
  subFile: any;
  fileName: string = '';
  srtFile: any;

  languages: object | any;

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

      this.http.get('assets/lang.json')
        .subscribe(data => {
          this.languages = data;
          // console.log('File Content:', this.languages);
        }, error => {
          console.error('Error reading file:', error);
        });

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


  async FromSelect(event: Event) {
    this.isUploaded = true;
    const input = event.target as HTMLInputElement;
    this.fromLang = input.value;
    // console.log(input.value)
  }

  async ToSelect(event: Event) {
    this.isUploaded = true;
    const input = event.target as HTMLInputElement;
    this.toLang = input.value;
    // console.log(input.value)
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

    const splitedName = this.videoFile.name.split('.');
    this.fileName = splitedName[0];

    await this.ffmpeg.run('-i', fileName, '-vn', '-acodec', 'libmp3lame', outputName);

    const data = this.ffmpeg.FS('readFile', outputName);
    const arrayBuffer = new Uint8Array(data).buffer;
    this.audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    this.audioBlobUrl = URL.createObjectURL(this.audioBlob);

    this.loading = false;
  }

  async handleGenerate() {
    this.loading = true;
    const formData = new FormData();
    formData.append('audio', this.audioBlob, 'audio.mp3');
    // console.log(this.fromLang, this.toLang);
    formData.append('fr', this.fromLang);
    formData.append('to', this.toLang);

    try {
      const srtBlob = await this.http.post('http://localhost:5000/transcribe', formData, {
        responseType: 'text'
      }).toPromise();

      console.log(srtBlob);

      await this.mergeVideoWithSubtitles2(srtBlob);
      this.convertVttToSrt(srtBlob);

      this.isGenerated = true;
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Subtitle generation successfully' });

    } catch (err) {
      // console.error('Subtitle generation failed:', err);
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

  convertVttToSrt(vttText: any) {

    const lines = vttText.split('\n');
    let srtLines = [];
    let index = 1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        srtLines.push(String(index++));
        srtLines.push(
          lines[i]
            .replace('.', ',') // Replace decimal to comma for SRT
            .replace(/(\d{2}:\d{2}:\d{2}),(\d{3}) --> (\d{2}:\d{2}:\d{2}),(\d{3})/, '$1,$2 --> $3,$4')
        );
        srtLines.push(lines[i + 1] || '');
        srtLines.push('');
      }
    }

    this.srtFile = srtLines.join('\n');
  }

  async embedVideoWithSubtitles() {
    // await this.loadFFmpeg();
    this.loading = true;

    const inVid = 'input.mp4';
    const inSrt = 'subs.vtt';
    const outVid = 'out.mp4';
    // const fontPath = 'tmp/Roboto-Regular.ttf';


    // const srtBlob = new Blob([this.srtFile], { type: 'text' });
    // console.log(this.videoFile, srtBlob);



    this.ffmpeg.FS('writeFile', inVid, await fetchFile(this.videoFile));
    this.ffmpeg.FS('writeFile', inSrt, await fetchFile(this.subFile));
    // this.ffmpeg.FS('writeFile', fontPath, await fetchFile('/assets/fonts/Roboto-Regular.ttf'));

    await this.ffmpeg.run(
      '-i', inVid,
      '-vf', `subtitles=${inSrt}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&H00FFFFFF'`,
      '-c:v', 'libx264',
      '-c:a', 'copy',
      'out.mp4'
    );

    // const data = this.ffmpeg.FS('readFile', outVid);
    // const mergedBlob = new Blob([data.buffer], { type: 'video/mp4' });
    // this.finalVideoUrl = URL.createObjectURL(mergedBlob);
    const data = this.ffmpeg.FS('readFile', outVid);

    const arrayBuffer = new Uint8Array(data).buffer;

    const mergedBlob = new Blob([arrayBuffer], { type: 'video/mp4' });

    this.finalVideoUrl = URL.createObjectURL(mergedBlob);

    const a = document.createElement('a');
    a.href = this.finalVideoUrl;
    a.download = this.fileName + '(subtai.com).mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    this.ffmpeg.FS('unlink', inVid);
    this.ffmpeg.FS('unlink', inSrt);
    // this.ffmpeg.FS('unlink', fontPath);
    this.ffmpeg.FS('unlink', outVid);

    this.loading = false;

  }

  private async mergeVideoWithSubtitles2(vttFile: any) {

    // console.log(typeof (vttFile), ":", vttFile);


    let videoId = document.getElementById("videoDown") as HTMLVideoElement;
    const blob = new Blob([vttFile], { type: 'text/vtt' });

    const subUrl = URL.createObjectURL(blob);
    this.subFile = subUrl;
    // console.log(this.subFile);

    const track = document.createElement('track');

    track.kind = 'subtitles';
    track.label = this.toLang;
    track.srclang = this.toLang;
    track.src = subUrl;
    track.default = true;

    videoId.appendChild(track);
  }

  async handleEmbedSubtitleFile() {

    this.loading = true;

    const a = document.createElement('a');
    a.href = this.subFile;
    a.download = this.fileName + ' (subtai.com).vtt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    this.loading = false;
  }

}
