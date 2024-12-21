/* src/app/app.component.ts */
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthGuard } from './auth.guard';

const routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'add-client', loadComponent: () => import('./client-form/client-form.component').then(m => m.ClientFormComponent), canActivate: [AuthGuard] },
  { path: 'clients', loadComponent: () => import('./client-list/client-list.component').then(m => m.ClientListComponent), canActivate: [AuthGuard] },
  { path: 'add-lead', loadComponent: () => import('./lead-form/lead-form.component').then(m => m.LeadFormComponent), canActivate: [AuthGuard] },
  { path: 'lead-dashboard', loadComponent: () => import('./lead-dashboard/lead-dashboard.component').then(m => m.LeadDashboardComponent), canActivate: [AuthGuard] }
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `
    <nav>
      <a routerLink="/login" routerLinkActive="active">Login</a>
      <a routerLink="/register" routerLinkActive="active">Register</a>
      <a routerLink="/forgot-password" routerLinkActive="active">Forgot Password</a>
      <a routerLink="/add-client" routerLinkActive="active">Add Client</a>
      <a routerLink="/clients" routerLinkActive="active">View Clients</a>
      <a routerLink="/add-lead" routerLinkActive="active">Add Lead</a>
      <a routerLink="/lead-dashboard" routerLinkActive="active">Lead Dashboard</a>
    </nav>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'Baseline';
}
