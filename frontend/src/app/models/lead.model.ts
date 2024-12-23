/* src/app/models/lead.model.ts */
export interface Lead {
  id: number;
  source: string;
  contactName: string;
  contactPhone: number;
  contactEmail: string;
  potentialValue: number;
  status: string;
  stage: string;
  priority: string;
}
