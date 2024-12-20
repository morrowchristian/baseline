// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientFormComponent } from './client-form/client-form.component';
import { ClientListComponent } from './client-list/client-list.component';
import { LeadFormComponent } from './lead-form/lead-form.component';
import { LeadDashboardComponent } from './lead-dashboard/lead-dashboard.component';

const routes: Routes = [
  { path: 'add-client', component: ClientFormComponent },
  { path: 'clients', component: ClientListComponent },
  { path: 'add-lead', component: LeadFormComponent},
  { path: 'leads', component: LeadDashboardComponent},
  { path: '', redirectTo: '/clients', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
