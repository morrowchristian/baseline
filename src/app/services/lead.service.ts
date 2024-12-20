// src/app/shared/services/lead.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Lead } from '../models/lead.model';

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private leadsSubject = new BehaviorSubject<Lead[]>([]);
  leads$: Observable<Lead[]> = this.leadsSubject.asObservable();

  getLeads(): Lead[] {
    return this.leadsSubject.getValue();
  }

  updateLeads(leads: Lead[]): void {
    this.leadsSubject.next(leads);
  }

  addLead(lead: Lead): void {
    const currentLeads = this.getLeads();
    this.updateLeads([...currentLeads, lead]);
  }
}
