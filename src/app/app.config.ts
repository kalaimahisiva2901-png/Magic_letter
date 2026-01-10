import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    provideFirebaseApp(() =>
      initializeApp({
        apiKey: "AIzaSyCVRUePGibGYYvotGCbkuzME5JPjbXc4p0",
        authDomain: "magic-letter-d4134.firebaseapp.com",
        projectId: "magic-letter-d4134",
        storageBucket: "magic-letter-d4134.appspot.com",
        messagingSenderId: "963354604852",
        appId: "1:963354604852:web:ff4916b39ed8237b936161"
      })
    ),

    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
};
  
