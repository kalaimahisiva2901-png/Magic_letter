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

    App.addListener('backButton', ({ canGoBack }) => {
      const now = Date.now();

      // 🔹 BACK ONCE → GO TO PREVIOUS PAGE (ANY PAGE)
      if (canGoBack) {
        this.location.back();
        return;
      }

      // 🔹 AT ROOT → DOUBLE BACK TO EXIT APP
      if (now - this.lastBackPress < this.exitDelay) {
        App.exitApp();
      }

      this.lastBackPress = now;
    });
  }
}

