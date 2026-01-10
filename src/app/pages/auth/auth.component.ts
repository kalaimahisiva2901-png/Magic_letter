import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-auth',
  standalone: true,
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {

  isSigningIn = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async loginWithGoogle() {
    if (this.isSigningIn) return;
    this.isSigningIn = true;

    try {
      const user: User | null = await this.auth.googleLogin();

      if (user) {
        await this.router.navigateByUrl('/', { replaceUrl: true });
        return;
      }

      throw new Error('Login failed');

    } catch (err) {
      console.error(err);
      alert('Google sign-in failed');
      this.isSigningIn = false;
    }
  }
}
