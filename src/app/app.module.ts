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
import { AppRoutingModule } from './app-routing.module';

@NgModule({    
  imports: [
    AppComponent,
    BrowserModule,
    FormsModule,
    ClientFormComponent,
    ClientListComponent,
    HttpClientModule,
    RouterModule,
    AppRoutingModule
  ],
  providers: [ClientService],
  bootstrap: [AppComponent]
})
export class AppModule { }