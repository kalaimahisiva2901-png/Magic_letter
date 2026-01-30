import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

import {
  LetterService,
  LetterAttempt
} from '../../services/letter.service';

type LetterStatus = 'locked' | 'unlocked' | 'opened';

interface LetterRow {
  code: string;
  unlockAt: number;
  letterText: string;
  status: LetterStatus;
  attemptId?: string;
}

@Component({
  selector: 'app-open-letter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './open-letter.component.html',
  styleUrl: './open-letter.component.css'
})
export class OpenLetterComponent implements OnInit, OnDestroy {

  secretCode = '';
  letterText = '';
  message = '';
  status: LetterStatus | null = null;

  remainingText = '';
  progress = 0;
  isFinalSeconds = false;
  finalSeconds = 0;

  lettersTable: LetterRow[] = [];
  private timer: any;
  private currentCode = '';

  constructor(
    private letterService: LetterService,
    private auth: Auth,
    private router: Router
  ) {}

  get userId(): string {
    return this.auth.currentUser?.uid ?? '';
  }

  /* ---------- INIT ---------- */
  async ngOnInit() {
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    const attempts: LetterAttempt[] =
      await this.letterService.getMyAttempts(this.userId);

    for (const attempt of attempts) {
      const data: any =
        await this.letterService.getLetterByCode(attempt.letterCode);

      if (!data) continue;

      const now = Date.now();
      const status: LetterStatus =
        now < attempt.unlockAt ? 'locked' : 'unlocked';

      this.lettersTable.push({
        code: attempt.letterCode,
        unlockAt: attempt.unlockAt,
        letterText: data.letterText,
        status,
        attemptId: attempt.id
      });
    }

    this.sortTable();
  }

  /* ---------- ENTER CODE ---------- */
  async open() {
    clearInterval(this.timer);
    this.message = '';
    this.status = null;

    if (!this.secretCode) {
      this.message = 'Please enter secret code';
      return;
    }

    if (await this.letterService.isLetterOpened(this.secretCode)) {
      this.message = 'This letter has already been opened';
      return;
    }

    const data: any =
      await this.letterService.getLetterByCode(this.secretCode);

    if (!data) {
      this.message = 'Invalid secret code';
      return;
    }

    const unlockAt = Number(data.unlockAt);
    const now = Date.now();

    const attempt = await this.letterService.saveAttempt(
      this.secretCode,
      this.userId,
      unlockAt
    );

    this.currentCode = this.secretCode;

    this.lettersTable.push({
      code: this.secretCode,
      unlockAt,
      letterText: data.letterText,
      status: now < unlockAt ? 'locked' : 'unlocked',
      attemptId: attempt.id
    });

    this.sortTable();

    if (now < unlockAt) {
      this.status = 'locked';
      this.startTimer(unlockAt);
    } else {
      this.status = 'unlocked';
    }
  }

  /* ---------- TIMER ---------- */
  startTimer(unlockAt: number) {
    const total = unlockAt - Date.now();

    this.timer = setInterval(() => {
      const diff = unlockAt - Date.now();

      if (diff <= 0) {
        clearInterval(this.timer);
        this.status = 'unlocked';
        return;
      }

      const seconds = Math.floor(diff / 1000);

      if (seconds <= 60) {
        this.isFinalSeconds = true;
        this.finalSeconds = seconds;
      } else {
        this.remainingText = this.format(diff);
        this.progress = 100 - Math.floor((diff / total) * 100);
      }
    }, 1000);
  }

  /* ---------- OPEN LETTER ---------- */
  async openLetter() {
    await this.letterService.openLetterOnce(
      this.currentCode,
      this.userId
    );

    const row = this.lettersTable.find(
      r => r.code === this.currentCode
    );
    if (!row) return;

    row.status = 'opened';
    this.status = 'opened';
    this.letterText = row.letterText;

    if (row.attemptId) {
      await this.letterService.deleteAttempt(row.attemptId);
    }

    this.sortTable();
  }

  sortTable() {
    const order = { locked: 0, unlocked: 1, opened: 2 };
    this.lettersTable.sort(
      (a, b) => order[a.status] - order[b.status]
    );
  }

  format(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h ${m % 60}m ${s % 60}s`;
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }
}
