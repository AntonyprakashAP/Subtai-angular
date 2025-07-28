import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Aura from '@primeng/themes/aura';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NgxSpinnerService } from 'ngx-spinner';
import { provideNgxSkeletonLoader } from 'ngx-skeleton-loader';


export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideHttpClient(), provideAnimations(), NgxSpinnerService, provideRouter(routes), provideAnimationsAsync(), provideClientHydration(withEventReplay()), MessageService, providePrimeNG({
    theme: {
      preset: Aura
    }
  }),
  provideNgxSkeletonLoader({
    theme: {
      extendsFromRoot: true,
      height: '30px',
    },
  }),]
};
