import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Aura from '@primeng/themes/aura';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';


export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }),provideHttpClient(),  provideRouter(routes), provideAnimationsAsync(), provideClientHydration(withEventReplay()), MessageService, providePrimeNG({
    theme: {
      preset: Aura
    }
  })]
};
