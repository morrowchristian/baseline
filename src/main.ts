import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { AppComponent } from './app/app.component';
import { bootstrapApplication } from '@angular/platform-browser';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

bootstrapApplication(AppComponent)
  .catch(err => console.error(err));
