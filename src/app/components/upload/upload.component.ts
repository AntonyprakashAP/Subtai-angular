import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthService } from '../../_service/auth.service';
import { NgxSpinnerComponent, NgxSpinnerService } from 'ngx-spinner';


@Component({
  selector: 'app-upload',
  imports: [
    HeaderComponent,
    CommonModule,
    NgxSpinnerComponent
  ],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
  providers: [AuthService],
})
export class UploadComponent implements OnInit {


  @ViewChild('inputFileRef') inputFileRef!: ElementRef;

  isUploaded = false;
  video: SafeUrl | null = null;
  isGenerated = false;
  selectedLang: string = '';
  videoFile: File | null = null;
  // videoToDisplay: SafeUrl | null = null;
  loading = false;
  languages: string[] = [
    "Arabic-ar",
    "Bengali-bn",
    "Chinese-zh",
    "English-en",
    "German-de",
    "Greek-el",
    "Gujarati-gu",
    "Hindi-hi",
    "Italian-it",
    "Japanese-ja",
    "Kannada-kn",
    "Korean-ko",
    "Malay-ms",
    "Malayalam-ml",
    "Portuguese-pt",
    "Punjabi-pa",
    "Romanian-ro",
    "Russian-ru",
    "Spanish-es",
    "Tamil-ta",
    "Telugu-te",
    "Turkish-tr",
    "Urdu-ur"];


  selectedFile!: File;
  videoUrl: string = '';
  isUploading = false;
  uploadError = '';

  constructor(
    private router: Router,
    private subtitleService: AuthService,
    private sanitizer: DomSanitizer,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    if (history !== undefined) {
      const data = history.state.video;
      if (data != null) {
        this.isUploaded = true;
        this.video = URL.createObjectURL(data);
        this.videoFile = data;
        // this.spinner.show(); 
        if (this.videoFile != null) {
          this.handleUpload(this.videoFile)
        }
      }
    }
  }

  onButtonClick(): void {
    const file = this.inputFileRef.nativeElement.click();
    console.log(file);
    
  }

  handleOnChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.type === 'video/mp4') {
      this.isUploaded = true;
      this.video = file;
    }
  }

  handleChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedLang = value;
  }

  handleGenerate(): void {
    this.isGenerated = true;
    this.loading = true;

    if (this.videoFile) {
      console.log("File founded")
      // this.handleUpload(this.videoFile);
      this.fetchData()
    }
    console.log("end of api call");

  }

  async handleUpload(data: File) {
    this.isUploading = true;
    this.uploadError = '';
    this.loading = true;
    try {
      console.log("try block working");

      const response = await this.subtitleService.uploadAndProcessVideo(data, this.selectedLang);
      console.log("after try block executing");
      console.log('Video uploaded successfully:', this.videoUrl);
      console.log(response);

      if (response != null) {
        this.loading = false
      }

    } catch (err: any) {
      this.uploadError = err.message || 'Upload failed';
      // console.error(err);
    } finally {

    }
  }

  async fetchData() {
    if (!this.videoFile) return;

    this.loading = true;

    try {
      const finalVideoUrl = await this.subtitleService.fetchSubtitledVideo(
        this.videoFile,
        this.selectedLang
      );

      if (finalVideoUrl != null) {
        console.log(finalVideoUrl);

        this.video = this.sanitizer.bypassSecurityTrustResourceUrl(finalVideoUrl);
        this.videoUrl = finalVideoUrl;
        this.loading = false
      }
    } catch (error) {
      console.error('Error fetching video:', error);
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.videoFile = input.files[0];
    }
  }

  downloadVideo() {
    const a = document.createElement('a');
    if (this.video) {
      a.href = this.videoUrl as string;
      a.click();
      console.log(a);
      
    }
  }

  handleFileSelection(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

}
