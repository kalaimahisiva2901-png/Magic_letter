import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class LetterService {

  constructor(private firestore: Firestore) {}

  // 🔐 SAVE LETTER (OWNER STORED)
  saveLetter(data: any) {
    return addDoc(collection(this.firestore, 'letters'), data);
  }

  // 🔐 GET ONLY MY LETTERS (HOME PAGE)
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

  // 🔓 GET LETTER BY MAGIC CODE (ANY USER)
  async getLetterByCode(code: string) {
    const q = query(
      collection(this.firestore, 'letters'),
      where('secretCode', '==', code)
    );

    const snap = await getDocs(q);
    return snap.empty ? null : snap.docs[0].data();
  }
}


