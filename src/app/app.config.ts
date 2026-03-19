import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SYSTEM_DESIGN_CONFIG } from 'dynamic-ds';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: SYSTEM_DESIGN_CONFIG,
      useValue: {
        brand: '#E18308',
        primary: '#006BDF',
        secondary: '#9F5100',
        functional: '#006BDF',
        utility: '#CF0026',
      },
    },
  ],
};
