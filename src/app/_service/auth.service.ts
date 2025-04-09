import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private ip = '';

  constructor(private http: HttpClient) {}

  async fetchSubtitledVideo(videoFile: File, lang: string): Promise<string> {
    const fileName = encodeURIComponent(videoFile.name);
    const langCode = encodeURIComponent(lang.toLowerCase().split("-")[0]);
    const baseName = videoFile.name.split(".").slice(0, -1).join(".");

    console.log(fileName,langCode,baseName)
    const input = `inpfl=${fileName}&lang=${langCode}`;
    const fullUrl = `${`http://${this.ip}/getSubtitle/`}${input}`;

    await this.http.get(fullUrl).toPromise();

    return `https://sample-work-2.s3.us-east-1.amazonaws.com/subtai_files/${encodeURIComponent(baseName)}_subtai_added.mp4`;
  }

  async uploadAndProcessVideo(videoFile: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', videoFile);

    const encodedName = encodeURIComponent(videoFile.name);
    const params = new HttpParams().set('fname', videoFile.name);

    try {
      // Upload the video
      await this.http.post('https://avptutoring.com/TRAINING/TEST/app/upload_video', formData).toPromise();

      // First GET call
      await this.http.get(`http://${this.ip}/copyFileToServer/`, { params }).toPromise();

      // Second GET call
      await this.http.get(`http://${this.ip}/copyToCloud/`, { params }).toPromise();

      // Final video URL
      return `https://sample-work-2.s3.us-east-1.amazonaws.com/subtai_files/${encodedName}`;
    } catch (err) {
      throw err;
    }
  }
}
