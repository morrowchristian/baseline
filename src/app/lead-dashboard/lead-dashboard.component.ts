/* src/app/features/lead-dashboard/lead-dashboard.component.ts */
import { Component, OnInit } from '@angular/core';
import { LeadService } from '../services/lead.service';
import { Lead } from '../models/lead.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lead-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lead-dashboard.component.html',
  styleUrls: [ './lead-dashboard.component.css' ]
})
export class LeadDashboardComponent implements OnInit {
  leads: Lead[] = [];

  constructor(private leadService: LeadService) {}

  ngOnInit(): void {
    this.leadService.leads$.subscribe((leads) => {
      this.leads = leads;
      // Update charts and graphs here
    });
  }
}
