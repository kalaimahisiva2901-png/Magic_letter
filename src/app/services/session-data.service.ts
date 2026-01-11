import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionDataService {

  private getKey(key: string, userId: string) {
    return `${key}_${userId}`;
  }

  set(key: string, userId: string, value: any) {
    sessionStorage.setItem(
      this.getKey(key, userId),
      JSON.stringify(value)
    );
  }

  get<T>(key: string, userId: string): T | null {
    const data = sessionStorage.getItem(this.getKey(key, userId));
    return data ? JSON.parse(data) : null;
  }

  clearAll() {
    sessionStorage.clear();
  }
}
