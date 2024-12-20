// src/app/features/lead-form/lead-form.component.ts
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { LeadService } from '../services/lead.service';
import { Lead } from '../models/lead.model';

@Component({
  selector: 'app-lead-form',
  imports: [FormsModule],
  templateUrl: './lead-form.component.html',
  styleUrls: ['./lead-form.component.css']
})
export class LeadFormComponent {
  lead: Lead = { id: 0, source: '', contactInfo: '', potentialValue: 0, status: '', stage: '', priority: '' };

  constructor(private leadService: LeadService) {}

  onSubmit(form: NgForm) {
    this.leadService.addLead(this.lead);
    form.reset();
  }
}
