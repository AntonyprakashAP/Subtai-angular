import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private ip = '52.90.12.202';

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
    if (!videoFile) {
      console.error("uploadAndProcessVideo was called with null file.");
    }
    
    const formData = new FormData();
    formData.append('file', videoFile);

    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }    

    const encodedName = encodeURIComponent(videoFile.name);
    const params = new HttpParams().set('fname', videoFile.name);

    console.log("Param",params," Form Data",formData);
    
    try {

      console.log("Entering to try block");
      
      // Upload the video
      this.http.post('https://avptutoring.com/TRAINING/TEST/app/upload_video', formData).subscribe(
        res => {
          console.log('Upload success:', res);
          this.http.get(`http://${this.ip}/copyFileToServer/`, { params }).subscribe(
            res => {
              console.log('Upload success:', res);
              console.log(
                "uploaded in godadday"
              );
              // Second GET call
              this.http.get(`http://${this.ip}/copyToCloud/`, { params }).subscribe(
                res => {
                  console.log('Upload success:', res);
                },
                err => console.error('Upload error:', err)
              );
              console.log(" copying to cloud");
            },
            err => console.error('Upload error:', err)
          );
          console.log(
            "copying godadday to server"
          );
        },
        err => console.error('Upload error:', err)

        
      );

     
      


      // Final video URL
      return `https://sample-work-2.s3.us-east-1.amazonaws.com/subtai_files/${encodedName}`;
    } catch (err) {
      throw err;
    }
  }
}
