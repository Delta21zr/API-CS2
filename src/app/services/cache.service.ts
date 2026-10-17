import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly LAST_SYNC_KEY = 'cs2_last_sync_time';

  constructor() {}

  async setCache(key: string, data: any): Promise<void> {
    await Preferences.set({
      key,
      value: JSON.stringify(data)
    });
  }

  async getCache<T = any>(key: string): Promise<T | null> {
    const { value } = await Preferences.get({ key });
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    }
    return null;
  }

  async removeCache(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  async clearCache(): Promise<void> {
    await Preferences.clear();
  }

  async setLastSyncTime(isoDate: string = new Date().toISOString()): Promise<void> {
    await this.setCache(this.LAST_SYNC_KEY, isoDate);
  }

  async getLastSyncTime(): Promise<string | null> {
    return await this.getCache<string>(this.LAST_SYNC_KEY);
  }

  /**
   * Actualiza de forma optimista la caché local cuando se encola una operación en modo offline
   */
  async applyOptimisticWrite(method: string, url: string, body: any): Promise<void> {
    try {
      const parsedUrl = new URL(url, 'http://localhost');
      const table = parsedUrl.searchParams.get('table');
      const idParam = parsedUrl.searchParams.get('id');
      if (!table) return;

      const baseTableUrl = `${parsedUrl.origin}${parsedUrl.pathname}?table=${table}`;
      const listData = await this.getCache<any[]>(baseTableUrl);
      if (!Array.isArray(listData)) return;

      const pkCol = table === 'market_items' ? 'item_id' : 'id';
      const upperMethod = method.toUpperCase();

      if (upperMethod === 'POST' && body) {
        const tempItem = {
          ...body,
          [pkCol]: body[pkCol] ?? Date.now(),
          _offlinePending: true
        };
        listData.push(tempItem);
        await this.setCache(baseTableUrl, listData);
      } else if ((upperMethod === 'PUT' || upperMethod === 'PATCH') && idParam && body) {
        const updated = listData.map(item =>
          String(item[pkCol]) === String(idParam)
            ? { ...item, ...body, _offlinePending: true }
            : item
        );
        await this.setCache(baseTableUrl, updated);
      } else if (upperMethod === 'DELETE' && idParam) {
        const filtered = listData.filter(item => String(item[pkCol]) !== String(idParam));
        await this.setCache(baseTableUrl, filtered);
      }
    } catch {
      // Si la URL es relativa sin origen válido o no tiene caché previa, ignorar silenciosamente
    }
  }
}

