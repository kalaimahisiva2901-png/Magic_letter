import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  deleteDoc
} from '@angular/fire/firestore';

/* ---------- TYPES ---------- */
export interface LetterAttempt {
  id: string;
  letterCode: string;
  userId: string;
  unlockAt: number;
  attemptedAt: number;
}

@Injectable({ providedIn: 'root' })
export class LetterService {

  constructor(private firestore: Firestore) {}

  /* =====================================================
     LETTER CREATION / OWNER SIDE (HOME & LOCK PAGES)
     ===================================================== */

  // SAVE LETTER
  async saveLetter(data: any) {
    return addDoc(
      collection(this.firestore, 'letters'),
      data
    );
  }

  // GET LETTERS CREATED BY USER
  async getMyLetters(userId: string) {
    const q = query(
      collection(this.firestore, 'letters'),
      where('userId', '==', userId)
    );

    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  // GET LETTER BY SECRET CODE
  async getLetterByCode(code: string) {
    const q = query(
      collection(this.firestore, 'letters'),
      where('secretCode', '==', code)
    );

    const snap = await getDocs(q);
    return snap.empty ? null : snap.docs[0].data();
  }

  /* =====================================================
     LETTER ATTEMPTS (LOCK / UNLOCK STATE)
     ===================================================== */

  // SAVE ATTEMPT (WHEN USER ENTERS CODE)
  async saveAttempt(
    code: string,
    userId: string,
    unlockAt: number
  ): Promise<{ id: string }> {
    const ref = await addDoc(
      collection(this.firestore, 'letter_attempts'),
      {
        letterCode: code,
        userId,
        unlockAt,
        attemptedAt: Date.now()
      }
    );

    return { id: ref.id };
  }

  // GET USER ATTEMPTS (RESTORE TABLE)
  async getMyAttempts(userId: string): Promise<LetterAttempt[]> {
    const q = query(
      collection(this.firestore, 'letter_attempts'),
      where('userId', '==', userId)
    );

    const snap = await getDocs(q);

    return snap.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<LetterAttempt, 'id'>)
    }));
  }

  // DELETE ATTEMPT (AFTER OPEN)
  async deleteAttempt(attemptId: string) {
    return deleteDoc(
      doc(this.firestore, 'letter_attempts', attemptId)
    );
  }

  /* =====================================================
     ONE-TIME GLOBAL OPEN
     ===================================================== */

  // CHECK IF LETTER ALREADY OPENED (BY ANYONE)
  async isLetterOpened(code: string): Promise<boolean> {
    const ref = doc(this.firestore, 'letter_opens', code);
    const snap = await getDoc(ref);
    return snap.exists();
  }

  // OPEN LETTER ONCE (GLOBAL)
  async openLetterOnce(code: string, userId: string) {
    const ref = doc(this.firestore, 'letter_opens', code);
    return setDoc(ref, {
      letterCode: code,
      openedByUserId: userId,
      openedAt: Date.now()
    });
  }
}


