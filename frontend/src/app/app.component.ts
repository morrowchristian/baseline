/* src/app/app.component.ts */
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthGuard } from './auth.guard';

const routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
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
