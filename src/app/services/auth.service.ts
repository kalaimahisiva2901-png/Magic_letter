import { Injectable } from '@angular/core';
import { Auth, signOut, GoogleAuthProvider, signInWithPopup, signInWithCredential, user, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user$: Observable<User | null>;

  constructor(private auth: Auth) {
    this.user$ = user(this.auth);
  }

  /* ---------- GOOGLE LOGIN (WEB + ANDROID) ---------- */
  async googleLogin(): Promise<User | null> {

    // 📱 ANDROID / IOS (CAPACITOR)
    if (Capacitor.isNativePlatform()) {
      const googleUser = await GoogleAuth.signIn();

      const credential = GoogleAuthProvider.credential(
        googleUser.authentication.idToken
      );

      const result = await signInWithCredential(this.auth, credential);
      return result.user;
    }

    // 🌐 WEB BROWSER
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(this.auth, provider);
    return result.user;
  }

  /* ---------- LOGOUT ---------- */
  async logout() {
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.signOut();
    }

    await signOut(this.auth);
    localStorage.clear();
    sessionStorage.clear();
  }

  /* ---------- HELPERS ---------- */
  getUser(): User | null {
    return this.auth.currentUser;
  }

  getUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }
}
