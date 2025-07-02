import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { timeout, concatMap } from 'rxjs/operators';



@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private ip = '13.218.47.106';

  constructor(private http: HttpClient) { }

  // async fetchSubtitledVideo(videoFile: File, lang: string): Promise<string> {
  //   const fileName = encodeURIComponent(videoFile.name);
  //   const langCode = encodeURIComponent(lang.toLowerCase().split("-")[0]);
  //   const baseName = videoFile.name.split(".").slice(0, -1).join(".");

  //   console.log(fileName, langCode, baseName)
  //   const input = `inpfl=${fileName}&lang=${langCode}`;
  //   const fullUrl = `${`http://${this.ip}/getSubtitle/`}${input}`;

  //   await this.http.get(fullUrl).toPromise();

  //   return `https://sample-work-2.s3.us-east-1.amazonaws.com/subtai_files/${encodeURIComponent(baseName)}_subtai_added.mp4`;
  // }

  async uploadAndProcessVideo(videoFile: File, lang: string): Promise<string> {
    if (!videoFile) {
      console.error("uploadAndProcessVideo was called with null file.");
    }

    const formData = new FormData();
    formData.append('file', videoFile);

    const fileName = encodeURIComponent(videoFile.name);
    const langCode = encodeURIComponent(lang.toLowerCase().split("-")[0]);
    const baseName = videoFile.name.split(".").slice(0, -1).join(".");

    console.log(fileName, langCode, baseName)
    const input = `inpfl=${fileName}&lang=${langCode}`;

    // for (const [key, value] of formData.entries()) {
    //   console.log(`${key}:`, value);
    // }

    const encodedName = encodeURIComponent(videoFile.name);
    const params = new HttpParams().set('fname', videoFile.name);

    console.log("Param", params, " Form Data", formData);

    try {

      console.log("Entering to try block");

      // // Upload the video
      // await this.http.post('https://avptutoring.com/TRAINING/TEST/app/upload_video', formData).toPromise();
      // await this.http.get(`http://${this.ip}/api/copyFileToServer/${params}`).toPromise();
      // await this.http.get(`http://${this.ip}/api/copyToCloud/${params}`).toPromise();
      // await this.http.get(`${`http://${this.ip}/getSubtitle/`}${input}`).toPromise();

      // of({ params, formData }).pipe( 
      // concatMap(({ formData }) =>
      //   this.http.post(`https://avptutoring.com/TRAINING/TEST/app/upload_video`, formData) 
      // // ),
      // concatMap(() => this.http.get(`http://${this.ip}/api/copyFileToServer/${params}`)),
      // concatMap(() => this.http.get(`http://${this.ip}/api/copyToCloud/${params}`)),
      // concatMap(() => this.http.get(`${`http://${this.ip}/getSubtitle/`}${input}`))
      // ).subscribe({
      //   next: res => console.log('Response:', res),
      //   error: err => console.error('Error:', err),
      //   complete: () => console.log('All API calls completed!')
      // });

      // this.http.get('http://${this.ip}/api/copyFileToServer/${params}').pipe(
      //   // concatMap((res1) => {
      //   //   console.log("Response one for Godaddy", res1)
      //   //   return this.http.get(``);
      //   // }
      //   // ),
      //   concatMap((res2) => {
      //     console.log("Response two for copying file to server",res2);
      //     return this.http.get(`http://${this.ip}/api/copyToCloud/${params}`);
      //   }),
      //   concatMap((res3) => {
      //     console.log("Response two for copying file to Cloud",res3);
      //     return this.http.get(`${`http://${this.ip}/getSubtitle/`}${input}`);
      //   })
      // )

      // Final video URL
      // return `https://sample-work-2.s3.us-east-1.amazonaws.com/subtai_files/${encodedName}`;


      this.http.post('https://avptutoring.com/TRAINING/TEST/app/upload_video', formData).pipe(
        concatMap(res1 => {
          console.log(' API 1 complete:', res1);
          return this.http.get(`http://${this.ip}/api/copyFileToServer/${params}`);
        }),
        concatMap(res2 => {
          console.log(' API 2 complete:', res2);
          return this.http.get(`http://${this.ip}/api/copyToCloud/${params}`);
        }),
        concatMap(res3 => {
          console.log(' API 3 complete:', res3);
          return this.http.get(`${`http://${this.ip}/getSubtitle/`}${input}`).pipe(
            timeout(60000)
          );
        })
      ).subscribe({
        next: (res4) => {
          console.log(' API 4 (file copy) complete:', res4);
        },
        error: (err) => {
          console.error(' Error in one of the APIs:', err);
        }
      });
      return `https://sample-work-2.s3.us-east-1.amazonaws.com/subtai_files/${encodeURIComponent(baseName)}_subtai_added.mp4`;

    } catch (err) {
      throw err;
    }
  }
}
