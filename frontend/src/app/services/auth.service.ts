/* src/app/services/auth.service.ts */
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn = false;

  constructor() { }

  login(username: string, password: string): boolean {
    // Add your authentication logic here
    if (username === 'admin' && password === 'admin') {
      this.loggedIn = true;
      return true;
    }
    return false;
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  sendPasswordResetLink(email: string): void {
    // Add logic to send password reset link
    console.log(`Password reset link sent to ${email}`);
  }

  signUp(username: string, email: string, password: string): void {
    // Add logic to handle user sign-up
    console.log(`User signed up with username: ${username}, email: ${email}`);
  }
}
