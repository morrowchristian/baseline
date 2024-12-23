/* src/app/models/project.model.ts */
export class Project {
  id?: number;
  name: string = '';
  type: 'Residential' | 'Commercial' | 'Industrial' | 'Renovation' | 'Other' = 'Residential';
  location: string = '';
  startDate: Date = new Date();
  completionDate: Date = new Date();
  budget: number = 0;
}
