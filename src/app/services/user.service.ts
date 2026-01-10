import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { User } from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class UserService {

  constructor(private firestore: Firestore) {}

  // 🔥 CREATE USER IF NOT EXISTS
  async saveUser(user: User) {
    const ref = doc(this.firestore, 'users', user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) return;

    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'User',
      photoURL: user.photoURL || null,
      provider: user.providerData[0]?.providerId || 'password',
      createdAt: serverTimestamp()
    });
  }

  // 📥 GET PROFILE
  async getUserProfile(uid: string) {
    const ref = doc(this.firestore, 'users', uid);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  }

  // ✏️ UPDATE PROFILE
  updateProfile(uid: string, data: any) {
    const ref = doc(this.firestore, 'users', uid);
    return updateDoc(ref, data);
  }

  // 🗑 DELETE USER DOCUMENT
  deleteUser(uid: string) {
    const ref = doc(this.firestore, 'users', uid);
    return deleteDoc(ref);
  }
}
