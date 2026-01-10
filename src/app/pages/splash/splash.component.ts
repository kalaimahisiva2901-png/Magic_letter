import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-splash',
  standalone: true,
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.css'
})
export class SplashComponent implements OnInit {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {

    // ⏳ minimum splash duration
    const minDelay = new Promise(resolve =>
      setTimeout(resolve, 2000)
    );

    // 🔐 wait for Firebase auth ONCE
    this.auth.user$.pipe(take(1)).subscribe(async user => {

      await minDelay;

      if (user) {
        // ✅ logged in
        this.router.navigateByUrl('/home', { replaceUrl: true });
      } else {
        // ❌ not logged in
        this.router.navigateByUrl('/auth', { replaceUrl: true });
      }

    });
  }
}
