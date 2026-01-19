import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  constructor(private router: Router) {

    // Run only on mobile
    if (!Capacitor.isNativePlatform()) return;

    App.addListener('backButton', () => {
      const currentUrl = this.router.url;

      // 📄 Not Home → Go Home
      if (currentUrl !== '/home') {
        this.router.navigate(['/home']);
        return;
      }

      // 🏠 Home → EXIT APP (NO MESSAGE)
      App.exitApp();
    });
  }
}
