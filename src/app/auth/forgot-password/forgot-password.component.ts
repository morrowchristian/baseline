// src/app/auth/forgot-password/forgot-password.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email: string = '';
  message: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  submitForgotPassword() {
    this.authService.forgotPassword(this.email).subscribe(
      (response) => {
        this.message = 'Password reset link sent to your email.';
      },
      (error) => {
        this.message = 'Error sending password reset link.';
      }
    );
  }
}
