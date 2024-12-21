import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import anime from 'animejs/lib/anime.es';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  forgotPasswordEmail: string = '';
  signUpUsername: string = '';
  signUpEmail: string = '';
  signUpPassword: string = '';
  errorMessage: string = '';
  showForm: string = 'login';
  showForgotPasswordForm: boolean = false;
  showSignUpForm: boolean = false;
  current: any = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    const emailElement = document.querySelector('#email');
    const passwordElement = document.querySelector('#password');
    const submitElement = document.querySelector('#submit');

    if (emailElement) {
      emailElement.addEventListener('focus', (e) => {
        if (this.current) this.current.pause();
        this.current = anime({
          targets: 'path',
          strokeDashoffset: {
            value: 0,
            duration: 700,
            easing: 'easeOutQuart'
          },
          strokeDasharray: {
            value: '240 1386',
            duration: 700,
            easing: 'easeOutQuart'
          }
        });
      });
    }

    if (passwordElement) {
      passwordElement.addEventListener('focus', (e) => {
        if (this.current) this.current.pause();
        this.current = anime({
          targets: 'path',
          strokeDashoffset: {
            value: -336,
            duration: 700,
            easing: 'easeOutQuart'
          },
          strokeDasharray: {
            value: '240 1386',
            duration: 700,
            easing: 'easeOutQuart'
          }
        });
      });
    }

    if (submitElement) {
      submitElement.addEventListener('focus', (e) => {
        if (this.current) this.current.pause();
        this.current = anime({
          targets: 'path',
          strokeDashoffset: {
            value: -730,
            duration: 700,
            easing: 'easeOutQuart'
          },
          strokeDasharray: {
            value: '530 1386',
            duration: 700,
            easing: 'easeOutQuart'
          }
        });
      });
    }
  }

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
    this.showForm = 'forgotPassword';
  }

  showSignUp() {
    this.showSignUpForm = true;
    this.showForgotPasswordForm = false;
    this.showForm = 'signUp';
  }

  submitForgotPassword() {
    // Implement the logic to handle forgot password submission
    console.log('Forgot Password email:', this.forgotPasswordEmail);
    // Reset the form and show a success message or navigate back to login
    this.showForm = 'login';
  }

  submitSignUp() {
    // Implement the logic to handle sign-up submission
    console.log('Sign Up details:', this.signUpUsername, this.signUpEmail, this.signUpPassword);
    // Reset the form and show a success message or navigate back to login
    this.showForm = 'login';
  }
}
