import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  GoogleAuth.initialize({
    clientId: '963354604852-j207cv906qmvofkkr415fs21t0bqtvvu.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
}

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
