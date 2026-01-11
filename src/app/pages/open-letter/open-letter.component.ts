import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LetterService } from '../../services/letter.service';
import { CommonModule } from '@angular/common';
import { SessionDataService } from '../../services/session-data.service';
import { Auth } from '@angular/fire/auth';

/* ---------- TYPES ---------- */
type LetterStatus = 'locked' | 'unlocked' | 'opened';

interface LetterRow {
  code: string;
  unlockAt: number;
  letterText: string;
  status: LetterStatus;
}

@Component({
  selector: 'app-open-letter',
  standalone: true,
  imports: [FormsModule, CommonModule],
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

  // 🔐 session keys
  private readonly TABLE_KEY = 'open_letters_table';

  constructor(
    private letterService: LetterService,
    private sessionData: SessionDataService,
    private auth: Auth,
    private router: Router
  ) {}

  /* ---------- FIREBASE USER ID ---------- */
  get userId(): string {
    return this.auth.currentUser?.uid ?? '';
  }

  /* ---------- LOAD SESSION DATA ---------- */
  ngOnInit() {
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    const table = this.sessionData.get<LetterRow[]>(
      this.TABLE_KEY,
      this.userId
    );

    if (table) {
      this.lettersTable = table;
      this.sortTable();
    }

    // ❌ DO NOT restore secretCode (important)
    this.secretCode = '';
  }

  /* ---------- ENTER CODE ---------- */
  async open() {
    clearInterval(this.timer);

    this.status = null;
    this.message = '';
    this.remainingText = '';
    this.progress = 0;
    this.isFinalSeconds = false;
    this.finalSeconds = 0;

    if (!this.secretCode) {
      this.message = 'Please enter secret code';
      return;
    }

    const data = await this.letterService.getLetterByCode(this.secretCode);

    if (!data) {
      this.message = 'Invalid secret code';
      return;
    }

    this.currentCode = this.secretCode;

    const now = Date.now();
    const unlockAt = Number(data['unlockAt']);

    let row = this.lettersTable.find(
      l => l.code === this.currentCode
    );

    if (!row) {
      row = {
        code: this.currentCode,
        unlockAt,
        letterText: data['letterText'],
        status: now < unlockAt ? 'locked' : 'unlocked'
      };
      this.lettersTable.push(row);
    }

    this.sortTable();
    this.saveTable();

    if (now < unlockAt) {
      this.status = 'locked';
      this.startTimer(unlockAt);
      return;
    }

    this.status = 'unlocked';
  }

  /* ---------- COUNTDOWN ---------- */
  startTimer(unlockAt: number) {
    const total = unlockAt - Date.now();

    this.timer = setInterval(() => {
      const diff = unlockAt - Date.now();

      if (diff <= 0) {
        clearInterval(this.timer);

        this.status = 'unlocked';

        const row = this.lettersTable.find(
          l => l.code === this.currentCode
        );
        if (row) row.status = 'unlocked';

        this.sortTable();
        this.saveTable();
        return;
      }

      const seconds = Math.floor(diff / 1000);

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

  /* ---------- USER OPENS LETTER ---------- */
  openLetter() {
    this.status = 'opened';

    const row = this.lettersTable.find(
      l => l.code === this.currentCode
    );

    if (row) {
      row.status = 'opened';
      this.letterText = row.letterText;
    }

    this.sortTable();
    this.saveTable();

    // ✅ RESET FORM STATE
    this.secretCode = '';
    this.currentCode = '';
    this.message = '';
  }

  /* ---------- SESSION STORAGE ---------- */
  saveTable() {
    this.sessionData.set(
      this.TABLE_KEY,
      this.userId,
      this.lettersTable
    );
  }

  /* ---------- SORT ---------- */
  sortTable() {
    const order: Record<LetterStatus, number> = {
      locked: 0,
      unlocked: 1,
      opened: 2
    };

    this.lettersTable.sort((a, b) => {
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      return a.unlockAt - b.unlockAt;
    });
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
