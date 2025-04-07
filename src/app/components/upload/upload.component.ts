import { Component, ElementRef, ViewChild } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload',
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule
  ],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss'
})
export class UploadComponent {
  isUploaded = false;
  isGenerated = false;
  selectedLang: string = '';
  languages: string[] = ["Arabic-ar",
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

  @ViewChild('inputFileRef') inputFileRef!: ElementRef;

  onButtonClick(): void {
    this.inputFileRef.nativeElement.click();
  }

  handleOnChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.type === 'video/mp4') {
      this.isUploaded = true;
      // You can do more like setting up the video source
    }
  }

  handleChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedLang = value;
  }

  handleGenerate(): void {
    this.isGenerated = true;
  }
}
