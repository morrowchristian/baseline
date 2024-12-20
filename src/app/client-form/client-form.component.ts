import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ClientService } from '../services/client.service';
import { Client } from '../models/client.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  standalone: true,
  selector: 'app-client-form',
  imports: [FormsModule],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.css']
})
export class ClientFormComponent {
  client: Client = new Client();

  constructor(private clientService: ClientService) {}

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.clientService.addClient(this.client).subscribe(response => {
        console.log('Client added successfully', response);
        form.reset();
      });
    }
  }
}
