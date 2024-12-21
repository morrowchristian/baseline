/* src/app/services/auth.service.ts */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post('/api/login', { username, password });
  }

  register(username: string, password: string): Observable<any> {
    return this.http.post('/api/register', { username, password });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post('/api/forgot-password', { email });
  }

  isLoggedIn(): boolean {
    // Simple Check for development, needs to be more robust later in development.
    return !!localStorage.getItem('authToken');
  }
}
