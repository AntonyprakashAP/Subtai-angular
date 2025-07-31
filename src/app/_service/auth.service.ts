import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
// import { of } from 'rxjs';
import { catchError, firstValueFrom, map, Observable, throwError, timeout, TimeoutError } from 'rxjs';
// import * as $ from 'jquery';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private IP: any = '13.219.72.216';
  private baseUrl = 'http://localhost:5000';

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

  register(username: string, password: string, email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, { username, password, email })
      .pipe(
        catchError(this.handleError)
      );
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, { username, password })
      .pipe(
        map((response: any) => {
          if (response && response.access_token) {
            localStorage.setItem('access_token', response.access_token);
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  getProtectedData(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No access token found'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.baseUrl}/protected`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * @returns 
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }


  logout(): void {
    localStorage.removeItem('access_token');
  }

  /**.
   * @param error 
   * @returns 
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.error && error.error.msg) {
      errorMessage = `Error: ${error.error.msg}`;
    } else if (error.status) {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(error);
    return throwError(() => new Error(errorMessage));
  }
}
