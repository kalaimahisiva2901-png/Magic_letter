import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LetterService } from '../../services/letter.service';

@Component({
  selector: 'app-open-letter',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './open-letter.component.html',
  styleUrl: './open-letter.component.css'
})
export class OpenLetterComponent implements OnDestroy {

  secretCode = '';
  letterText = '';
  message = '';

  status: 'locked' | 'ready' | 'opened' | null = null;

  unlockAt = 0;
  remainingText = '';
  progress = 0;

  // 🔥 final 60 seconds
  isFinalSeconds = false;
  finalSeconds = 0;

  private timer: any;

  constructor(
    private letterService: LetterService,
    private router: Router
  ) {}

  async open() {
    this.reset();

    if (!this.secretCode) {
      this.message = 'Please enter secret code';
      return;
    }

    const data = await this.letterService.getLetterByCode(this.secretCode);

    if (!data) {
      this.message = 'Invalid secret code';
      return;
    }

    this.unlockAt = Number(data['unlockAt']);
    const now = Date.now();

    if (now >= this.unlockAt) {
      this.status = 'ready';
      this.letterText = data['letterText'];
      return;
    }

    this.status = 'locked';
    this.startTimer(this.unlockAt, data['letterText']);
  }

  startTimer(unlockAt: number, letter: string) {
    const total = unlockAt - Date.now();

    this.timer = setInterval(() => {
      const diff = unlockAt - Date.now();

      if (diff <= 0) {
        clearInterval(this.timer);
        this.status = 'ready';
        this.isFinalSeconds = false;
        this.progress = 100;
        this.letterText = letter;
        return;
      }

      const seconds = Math.floor(diff / 1000);

      // 🔥 FINAL 60 SECONDS MODE
      if (seconds <= 60) {
        this.isFinalSeconds = true;
        this.finalSeconds = seconds;
      } else {
        this.isFinalSeconds = false;
        this.remainingText = this.format(diff);
        this.progress = 100 - Math.floor((diff / total) * 100);
      }

    }, 1000);
  }

  unlock() {
    this.status = 'opened';
  }

  format(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h ${m % 60}m ${s % 60}s`;
  }

  reset() {
    clearInterval(this.timer);
    this.status = null;
    this.letterText = '';
    this.message = '';
    this.progress = 0;
    this.remainingText = '';
    this.isFinalSeconds = false;
    this.finalSeconds = 0;
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }
}

