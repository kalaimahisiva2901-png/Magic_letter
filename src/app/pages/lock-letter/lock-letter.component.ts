import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LetterService } from '../../services/letter.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-lock-letter',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './lock-letter.component.html',
  styleUrl: './lock-letter.component.css'
})
export class LockLetterComponent implements OnDestroy {

  text = '';
  date = '';
  time = '';

  code = '';
  message = '';

  showCode = false;
  countdown = 5;
  isSaving = false;

  // keep preview safe
  previewText = '';

  private timer: any;

  constructor(
    private letterService: LetterService,
    private auth: AuthService,
    private router: Router
  ) {}

  async lock() {
    this.message = '';

    // 🔒 VALIDATION (IMPORTANT)
    if (!this.text.trim()) {
      this.message = 'Please write your letter';
      return;
    }

    if (!this.date) {
      this.message = 'Please select a date';
      return;
    }

    if (!this.time) {
      this.message = 'Please select a time';
      return;
    }

    const unlockAt = new Date(`${this.date}T${this.time}`).getTime();

    if (unlockAt <= Date.now()) {
      this.message = 'Unlock time must be in the future';
      return;
    }

    if (this.isSaving) return;
    this.isSaving = true;

    const userId = this.auth.getUserId();
    if (!userId) {
      this.message = 'User not logged in';
      this.isSaving = false;
      return;
    }

    // keep preview BEFORE clearing
    this.previewText = this.text.trim();

    this.code = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    await this.letterService.saveLetter({
      userId,
      letterText: this.previewText,
      unlockAt,
      secretCode: this.code,
      createdAt: Date.now()
    });

    // UI state
    this.showCode = true;
    this.startCountdown();

    // clear form inputs (NOT preview)
    this.text = '';
    this.date = '';
    this.time = '';
    this.isSaving = false;
  }

  startCountdown() {
    if (this.timer) clearInterval(this.timer);

    this.countdown = 5;

    this.timer = setInterval(() => {
      this.countdown--;

      if (this.countdown === 0) {
        this.showCode = false;
        clearInterval(this.timer);
      }
    }, 1000);
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }
}
