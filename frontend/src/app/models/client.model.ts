/* src/app/models/client.model.ts */
export class Client {
  id?: number;
  name: string = '';
  company?: string;
  email: string = '';
  phone: string = '';
  address: {
      street: string;
      city: string;
      state: string;
      zip: string;
  } = {
      street: '',
      city: '',
      state: '',
      zip: ''
  };
}
