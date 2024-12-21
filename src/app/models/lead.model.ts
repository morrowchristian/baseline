/* src/app/models/lead.model.ts */
export interface Lead {
  id: number;
  source: string;
  contactInfo: string;
  potentialValue: number;
  status: string;
  stage: string;
  priority: string;
}
