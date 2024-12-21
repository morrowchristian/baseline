/* src/app/login/login.component.ts */
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  showForm: string = 'login';
  showForgotPasswordForm: boolean = false;
  showSignUpForm: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (this.authService.login(this.username, this.password)) {
      this.router.navigate(['/clients']); // Redirect to default page after login
    } else {
      this.errorMessage = 'Invalid credentials';
    }
  }

  showForgotPassword() {
    this.showForgotPasswordForm = true;
    this.showSignUpForm = false;
  }

  showSignUp() {
    this.showSignUpForm = true;
    this.showForgotPasswordForm = false;
  }
}
