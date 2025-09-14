import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { WishService } from './wish.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideHttpClient(),
    WishService,
    provideAppInitializer(() => {
      const appConfigService = inject(WishService);
      const router = inject(Router);
      return appConfigService.fetchWishes().catch((error) => {
        console.error('App initialization failed:', error);
        return router.navigate(['/error']);
      });;
    })
  ]
};
