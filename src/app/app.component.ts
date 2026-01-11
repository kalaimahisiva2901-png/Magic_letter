import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Location } from '@angular/common';
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

  private lastBackPress = 0;
  private exitDelay = 2000; // 2 seconds

  constructor(private location: Location) {

    if (!Capacitor.isNativePlatform()) return;

    App.addListener('backButton', () => {
      const now = Date.now();
      const path = window.location.pathname;

      // ✅ NOT home → go back
      if (path !== '/home') {
        this.location.back();
        return;
      }

      // ✅ HOME → double back to exit
      if (now - this.lastBackPress < this.exitDelay) {
        App.exitApp();
      } else {
        this.lastBackPress = now;
        alert('Press back again to exit');
      }
    });
  }
}
