import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WhisperService {

 private apiUrl = 'http://localhost:3000/transcribe'; 

  constructor(private http: HttpClient) {}

  transcribe(file: File): Observable<{ text: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ text: string }>(this.apiUrl, formData);
  }}
