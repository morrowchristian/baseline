/* src/main.ts */
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withDebugTracing } from '@angular/router';
import { AppComponent } from './app/app.component';
import { AuthGuard } from './app/auth.guard';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./app/login/login.component').then(m => m.LoginComponent) },
      { path: 'add-client', loadComponent: () => import('./app/client-form/client-form.component').then(m => m.ClientFormComponent), canActivate: [AuthGuard] },
      { path: 'clients', loadComponent: () => import('./app/client-list/client-list.component').then(m => m.ClientListComponent), canActivate: [AuthGuard] },
      { path: 'add-lead', loadComponent: () => import('./app/lead-form/lead-form.component').then(m => m.LeadFormComponent), canActivate: [AuthGuard] },
      { path: 'lead-dashboard', loadComponent: () => import('./app/lead-dashboard/lead-dashboard.component').then(m => m.LeadDashboardComponent), canActivate: [AuthGuard] }
    ])
  ]
})
  .catch(err => console.error(err));
