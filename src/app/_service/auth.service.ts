import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
// import { of } from 'rxjs';
import { firstValueFrom, timeout, TimeoutError } from 'rxjs';
// import * as $ from 'jquery';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private IP: any;

  constructor(private http: HttpClient) { }

  async fetchSubtitledVideo(videoFile: File, lang: string): Promise<any> {
    const fileName = encodeURIComponent(videoFile.name);
    const langCode = encodeURIComponent(lang.toLowerCase().split("-")[0]);
    const baseName = videoFile.name.split(".").slice(0, -1).join(".");
    const params = new HttpParams().set('fname', videoFile.name);

    // console.log(fileName, langCode, baseName)
    const input = `inpfl=${fileName}&lang=${langCode}`;
    // const fullUrl = `${`http://${this.IP}/getSubtitle/`}${input}`;

    // await this.http.get(fullUrl).toPromise();
    // this.http.get(`http://${this.IP}/api/copyToCloud/${params}`).pipe( 
    //   concatMap(res3 => {
    //     console.log(' API 3 complete:', res3);
    //     return this.http.get(`${`http://${this.IP}/getSubtitle/`}${input}`).pipe(
    //       timeout(60000)
    //     );
    //   })
    // ).subscribe({
    //   next: (res4) => {
    //     console.log(' API 4 (file copy) complete:', res4);
    //   },
    //   error: (err) => {
    //     console.error(' Error in one of the APIs:', err);
    //   }
    // });

    try {
      
      const copyResponse = await firstValueFrom(
        this.http.get(`http://${this.IP}/api/copyToCloud/${params}`)
      );
      // console.log(' (copyToCloud) complete:', copyResponse);

      const subtitleResponse = await firstValueFrom(
        this.http.get(`http://${this.IP}/getSubtitle/${input}`).pipe(timeout(60000))
      );
      // console.log('(getSubtitle) complete:', subtitleResponse);

      if (subtitleResponse) {
        return `https://sample-work-2.s3.us-east-1.amazonaws.com/subtai_files/${encodeURIComponent(baseName)}_subtai_added.mp4`;
      }
      return null;
    } catch (err) {
      // if (err instanceof TimeoutError) {
      //   // console.error('Subtitle fetch timed out!');
      // } else {
      //   // console.error(err);
      // }
      throw err;
    }
  }

  async uploadAndProcessVideo(videoFile: File, lang: string): Promise<any> {
    if (!videoFile) {
      console.error("uploadAndProcessVideo was called with null file.");
    }

    const formData = new FormData();
    formData.append('file', videoFile);

    const fileName = encodeURIComponent(videoFile.name);
    const langCode = encodeURIComponent(lang.toLowerCase().split("-")[0]);
    const baseName = videoFile.name.split(".").slice(0, -1).join(".");

    // console.log(fileName, langCode, baseName)
    const input = `inpfl=${fileName}&lang=${langCode}`;

    // for (const [key, value] of formData.entries()) {
    //   console.log(`${key}:`, value);
    // }

    const encodedName = encodeURIComponent(videoFile.name);
    const params = new HttpParams().set('fname', videoFile.name);

    // console.log("Param", params, " Form Data", formData);

    try {

      // console.log("Entering to try block");

      // // Upload the video
      // await this.http.post('https://avptutoring.com/TRAINING/TEST/app/upload_video', formData).toPromise();
      // await this.http.get(`http://${this.IP}/api/copyFileToServer/${params}`).toPromise();
      // await this.http.get(`http://${this.IP}/api/copyToCloud/${params}`).toPromise();
      // await this.http.get(`${`http://${this.IP}/getSubtitle/`}${input}`).toPromise();

      // of({ params, formData }).pipe( 
      // concatMap(({ formData }) =>
      //   this.http.post(`https://avptutoring.com/TRAINING/TEST/app/upload_video`, formData) 
      // // ),
      // concatMap(() => this.http.get(`http://${this.IP}/api/copyFileToServer/${params}`)),
      // concatMap(() => this.http.get(`http://${this.IP}/api/copyToCloud/${params}`)),
      // concatMap(() => this.http.get(`${`http://${this.IP}/getSubtitle/`}${input}`))
      // ).subscribe({
      //   next: res => console.log('Response:', res),
      //   error: err => console.error('Error:', err),
      //   complete: () => console.log('All API calls completed!')
      // });

      // this.http.get('http://${this.IP}/api/copyFileToServer/${params}').pipe(
      //   // concatMap((res1) => {
      //   //   console.log("Response one for Godaddy", res1)
      //   //   return this.http.get(``);
      //   // }
      //   // ),
      //   concatMap((res2) => {
      //     console.log("Response two for copying file to server",res2);
      //     return this.http.get(`http://${this.IP}/api/copyToCloud/${params}`);
      //   }),
      //   concatMap((res3) => {
      //     console.log("Response two for copying file to Cloud",res3);
      //     return this.http.get(`${`http://${this.IP}/getSubtitle/`}${input}`);
      //   })
      // )

      // Final video URL
      // return `https://sample-work-2.s3.us-east-1.amazonaws.com/subtai_files/${encodedName}`;


      // await this.http.post('https://avptutoring.com/TRAINING/TEST/app/upload_video', formData).pipe(
      //   concatMap(res1 => {
      //     console.log(' API 1 complete:', res1);
      //     return this.http.get(`http://${this.IP}/api/copyFileToServer/${params}`);
      //   })
      // ).subscribe((res) => { 
      //   console.log(res);
      //   return res;

      // });

      const uploadResponse = await firstValueFrom(
        this.http.post('https://avptutoring.com/TRAINING/TEST/app/upload_video', formData)
      );
      // console.log(uploadResponse);

      const copyResponse = await firstValueFrom(
        this.http.get(`http://${this.IP}/api/copyFileToServer/${params}`)
      );
      // console.log(copyResponse);

      return copyResponse;
    } catch (err) {
      throw err;
    }
  }
}
