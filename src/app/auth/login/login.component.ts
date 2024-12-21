/* src/app/login/login.component.ts */
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoginFormComponent } from '../login-form/login-form.component';
import { RegisterComponent } from '../register/register.component';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, LoginFormComponent, RegisterComponent, ForgotPasswordComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  email: string = '';
  errorMessage: string = '';
  showForm: string = 'login';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (this.authService.login(this.username, this.password)) {
      this.router.navigate(['/clients']); // Redirect to default page after login
    } else {
      this.errorMessage = 'Invalid credentials';
    }
  }

  register() {
    if (this.authService.register(this.username, this.password)) {
      this.router.navigate(['/login']);
    } else {
      this.errorMessage = 'Registration failed';
    }
  }

  forgotPassword() {
    // Implement your forgot password logic here
    this.errorMessage = 'Forgot password request submitted';
  }

  toggleForm(form: string) {
    this.showForm = form;
  }
}
