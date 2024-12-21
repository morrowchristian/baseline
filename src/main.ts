/* src/main.ts */
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withDebugTracing } from '@angular/router';
import { AppComponent } from './app/app.component';
import { AuthGuard } from './app/auth.guard';
import { HttpClientModule } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(HttpClientModule),
    provideRouter([
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./app/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./app/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./app/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: 'add-client', loadComponent: () => import('./app/client-form/client-form.component').then(m => m.ClientFormComponent), canActivate: [AuthGuard] },
      { path: 'clients', loadComponent: () => import('./app/client-list/client-list.component').then(m => m.ClientListComponent), canActivate: [AuthGuard] },
      { path: 'add-lead', loadComponent: () => import('./app/lead-form/lead-form.component').then(m => m.LeadFormComponent), canActivate: [AuthGuard] },
      { path: 'lead-dashboard', loadComponent: () => import('./app/lead-dashboard/lead-dashboard.component').then(m => m.LeadDashboardComponent), canActivate: [AuthGuard] }
    ])
  ]
})
  .catch(err => console.error(err));
