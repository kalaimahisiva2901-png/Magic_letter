import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class LockLetterComponent implements OnInit, OnDestroy {

  // 🔐 LOCK FORM
  text = '';
  date = new Date().toISOString().split('T')[0];
  time = new Date().toTimeString().slice(0, 5);
  receiverName = '';

  code = '';
  message = '';

  showCode = false;
  countdown = 5;
  isSaving = false;

  previewText = '';
  private timer: any;

  // 📋 LOCKED LETTERS TABLE
  letters: any[] = [];
  now = Date.now();

  constructor(
    private letterService: LetterService,
    private auth: AuthService,
    private router: Router
  ) {}

  /* =====================
     LOAD LOCKED LETTERS
  ====================== */
  async ngOnInit() {
    const user = this.auth.getUser();
    if (!user) return;

    this.letters = await this.letterService.getMyLetters(user.uid);

    // update time for countdown display
    this.timer = setInterval(() => {
      this.now = Date.now();
    }, 1000);
  }

  /* =====================
     LOCK LETTER
  ====================== */
  async lock() {
    this.message = '';

    if (!this.receiverName.trim()) {
      this.message = 'Please enter receiver name';
      return;
    }

    if (!this.text.trim()) {
      this.message = 'Please write your letter';
      return;
    }

    if (!this.date || !this.time) {
      this.message = 'Please select date and time';
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

    // keep preview
    this.previewText = this.text.trim();

    this.code = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    await this.letterService.saveLetter({
      userId,
      receiverName: this.receiverName.trim(),
      letterText: this.previewText,
      unlockAt,
      secretCode: this.code,
      createdAt: Date.now()
    });

    this.showCode = true;
    this.startCountdown();

    // clear inputs
    this.text = '';
    this.receiverName = '';
    this.date = '';
    this.time = '';
    this.isSaving = false;

    // 🔄 reload letters so table updates
    this.letters = await this.letterService.getMyLetters(userId);
  }

  /* =====================
     HELPERS FOR TABLE
  ====================== */
  isLocked(letter: any) {
    return this.now < letter.unlockAt;
  }

  getTime(unlockAt: number) {
    const diff = unlockAt - this.now;
    if (diff <= 0) return 'Unlocked';

    const s = Math.floor((diff / 1000) % 60);
    const m = Math.floor((diff / 60000) % 60);
    const h = Math.floor((diff / 3600000) % 24);
    const d = Math.floor(diff / 86400000);

    if (d) return `${d}d ${h}h`;
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m ${s}s`;
    return `${s}s`;
  }

  /* =====================
     UI HELPERS
  ====================== */
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
