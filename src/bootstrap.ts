import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Trigger Deploy #1
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
