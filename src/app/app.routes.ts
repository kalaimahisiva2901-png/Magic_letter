import { Routes } from '@angular/router';
import { SplashComponent } from './pages/splash/splash.component';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [

  // 🔥 ENTRY POINT — ALWAYS SPLASH
  {
    path: '',
    component: SplashComponent
  },

  // 🔐 AUTH (ONLY IF NOT LOGGED IN)
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/auth.component')
        .then(m => m.AuthComponent)
  },

  // 🏠 HOME (LOGGED IN USERS)
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/home/home.component')
        .then(m => m.HomeComponent)
  },

  // 🔒 CREATE / LOCK LETTER
  {
    path: 'lock',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/lock-letter/lock-letter.component')
        .then(m => m.LockLetterComponent)
  },

  // 🔓 OPEN LETTER
  {
    path: 'open',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/open-letter/open-letter.component')
        .then(m => m.OpenLetterComponent)
  },

  // ❌ FALLBACK → SPLASH (NOT AUTH)
  {
    path: '**',
    redirectTo: ''
  }
];
