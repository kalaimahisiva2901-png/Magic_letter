import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LetterService } from '../../services/letter.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {

  letters: any[] = [];
  now = Date.now();
  timer: any;

  showSettings = false;
  userName = 'User';
  userEmail = '';

  constructor(
    private letterService: LetterService,
    private auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    const user = this.auth.getUser();
    if (!user) return;

    this.userEmail = user.email ?? '';

    this.userName = this.userEmail
      ? this.userEmail.split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())
      : 'User';

    const data = await this.letterService.getMyLetters(user.uid);

    // ✅ LOCKED FIRST → UNLOCKED LAST
    this.letters = data.sort((a: any, b: any) => {
      const aLocked = a.unlockAt > Date.now();
      const bLocked = b.unlockAt > Date.now();

      if (aLocked && !bLocked) return -1; // a up
      if (!aLocked && bLocked) return 1;  // b up

      return a.unlockAt - b.unlockAt; // time order
    });

    this.timer = setInterval(() => {
      this.now = Date.now();
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

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

  goToLock() {
    this.router.navigate(['/lock']);
  }

  goToOpen() {
    this.router.navigate(['/open']);
  }

  openSettings() {
    this.showSettings = true;
  }

  closeSettings() {
    this.showSettings = false;
  }

  logout() {
    this.showSettings = false;
    this.auth.logout().then(() => {
      this.router.navigateByUrl('/auth', { replaceUrl: true });
    });
  }

  // 1. Add this property at the top of your class
expandedLetterCode: string | null = null;

// 2. Add these methods
toggleExpand(code: string) {
  this.expandedLetterCode = this.expandedLetterCode === code ? null : code;
}

copyCode(code: string) {
  navigator.clipboard.writeText(code);
  // Optional: add a toast or alert here
}

shareTableLetter(l: any) {
  const unlockDate = new Date(l.unlockAt).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const message = `✨ *You've received a Locked Letter!* ✨%0A%0AHi *${l.receiverName || 'there'}*! 👋 You have a digital time capsule waiting.%0A%0A⏳ *UNLOCKS ON:*%0A${unlockDate}%0A%0A🔑 *YOUR MAGIC CODE:*%0A\`${l.secretCode}\`%0A%0A---------------------------%0A🚀 *OPEN IT HERE:*%0Ahttps://magicletter.app`;

  window.open(`https://wa.me/?text=${message}`, '_blank');
}
}
