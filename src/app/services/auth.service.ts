/* src/app/services/auth.service.ts */
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private users: { username: string; password: string }[] = [];
  private loggedIn = false;

  register(username: string, password: string): boolean {
    const userExists = this.users.some(user => user.username === username);
    if (userExists) {
      return false; // User already exists
    }
    this.users.push({ username, password });
    return true;
  }

  login(username: string, password: string): boolean {
    const user = this.users.find(user => user.username === username && user.password === password);
    if (user) {
      this.loggedIn = true;
      return true;
    }
    return false;
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  logout(): void {
    this.loggedIn = false;
  }
}

