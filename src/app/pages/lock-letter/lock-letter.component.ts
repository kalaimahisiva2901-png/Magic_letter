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
  isSaving = false;
  previewText = '';

  // Properties to preserve data for WhatsApp after form reset
  lastLockedDate = '';
  lastReceiver = '';

  // 📋 LOCKED LETTERS TABLE
  letters: any[] = [];
  lettersTable: any[] = [];
  now = Date.now();
  private timer: any;

  constructor(
    private letterService: LetterService,
    private auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    const user = this.auth.getUser();
    if (!user) return;

    this.letters = await this.letterService.getMyLetters(user.uid);
    this.buildLettersTable();

    this.timer = setInterval(() => {
      this.now = Date.now();
      this.buildLettersTable();
    }, 1000);
  }

  /* =====================
      BUILD TABLE DATA
  ====================== */
  buildLettersTable() {
    this.lettersTable = this.letters.map(letter => {
      let status = 'locked';
      if (this.now >= letter.unlockAt) status = 'unlocked';
      if (letter.openedAt) status = 'opened';

      return {
        code: letter.secretCode,
        unlockAt: letter.unlockAt,
        receiverName: letter.receiverName, // ✅ FIXED: Added this to show in table
        status
      };
    });
  }

  /* =====================
      LOCK LETTER
  ====================== */
  async lock() {
    this.message = '';

    if (!this.receiverName.trim()) { this.message = 'Please enter receiver name'; return; }
    if (!this.text.trim()) { this.message = 'Please write your letter'; return; }

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

    // ✅ CAPTURE DATA for WhatsApp before clearing inputs
    this.lastReceiver = this.receiverName.trim();
    this.lastLockedDate = new Date(`${this.date}T${this.time}`).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    this.previewText = this.text.trim();

    this.code = Math.random().toString(36).substring(2, 8).toUpperCase();

    await this.letterService.saveLetter({
      userId,
      receiverName: this.lastReceiver,
      letterText: this.previewText,
      unlockAt,
      secretCode: this.code,
      createdAt: Date.now()
    });

    this.showCode = true;
    
    // Clear inputs
    this.text = '';
    this.receiverName = '';
    this.isSaving = false;

    this.letters = await this.letterService.getMyLetters(userId);
    this.buildLettersTable();
  }

  /* =====================
      WHATSAPP SHARE
  ====================== */
  shareLetter() {
    // ✅ FIXED: Uses captured data so it's never "Invalid Date"
    const message = `✨ *You've received a Locked Letter!* ✨

Hi *${this.lastReceiver}*! 👋 Someone sent you a digital time capsule. It’s sealed with magic and can only be opened at the perfect moment.

⏳ *UNLOCKS ON:*
${this.lastLockedDate}

🔑 *YOUR MAGIC CODE:*
\`${this.code}\`

---------------------------
🚀 *HOW TO OPEN IT:*
1. Download **Lock Letter**
👉 https://magicletter.app
2. Sign in and enter your code.

Keep this code safe! 🔐`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
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

  goHome() { this.router.navigate(['/home']); }

  ngOnDestroy() { if (this.timer) clearInterval(this.timer); }

  copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      const original = this.message;
      this.message = '✅ Code copied to clipboard!';
      setTimeout(() => this.message = original, 2000);
    });
  }

  // 🔽 ADD THIS PROPERTY FOR EXPANSION
  expandedLetterCode: string | null = null;

  // ... existing constructor & ngOnInit ...

  /* =====================
      EXPANSION LOGIC
  ====================== */
  // Toggle the expanded state of a card in the table
  toggleExpand(code: string) {
    this.expandedLetterCode = this.expandedLetterCode === code ? null : code;
  }

  // Share logic specifically for letters already in the table
  shareTableLetter(letter: any) {
    const unlockDate = new Date(letter.unlockAt).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const message = `✨ *You've received a Locked Letter!* ✨

Hi *${letter.receiverName}*! 👋 Someone sent you a digital time capsule. It’s sealed with magic and can only be opened at the perfect moment.

⏳ *UNLOCKS ON:*
${unlockDate}

🔑 *YOUR MAGIC CODE:*
\`${letter.code}\`

---------------------------
🚀 *HOW TO OPEN IT:*
1. Download **Lock Letter**
👉 https://magicletter.app
2. Sign in and enter your code.

Keep this code safe! 🔐`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }
}