import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  constructor() {}

  async setCache(key: string, data: any) {
    await Preferences.set({
      key,
      value: JSON.stringify(data)
    });
  }

  async getCache(key: string): Promise<any> {
    const { value } = await Preferences.get({ key });
    if (value) {
      return JSON.parse(value);
    }
    return null;
  }
  
  async clearCache() {
    await Preferences.clear();
  }
}
