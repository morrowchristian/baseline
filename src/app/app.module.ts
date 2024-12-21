/* src/app/app.module.ts */
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { ClientFormComponent } from './client-form/client-form.component';
import { ClientListComponent } from './client-list/client-list.component';
import { ClientService } from './services/client.service';
import { LeadService } from './services/lead.service';
import { AppRoutingModule } from './app-routing.module';
import { LeadFormComponent } from './lead-form/lead-form.component';
import { LeadDashboardComponent } from './lead-dashboard/lead-dashboard.component';

@NgModule({

  imports: [
    AppComponent,
    NgModule,
    BrowserModule,
    FormsModule,
    ClientFormComponent,
    ClientListComponent,
    LeadFormComponent,
    LeadDashboardComponent,
    HttpClientModule,
    RouterModule,
    AppRoutingModule,
    CommonModule
  ],
  providers: [ClientService, LeadService],
})
export class AppModule { }
