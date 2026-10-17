import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CacheService } from './cache.service';

describe('CacheService (Persistencia Local)', () => {
  let service: CacheService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), CacheService]
    });
    service = TestBed.inject(CacheService);
    await service.clearCache();
  });

  it('debe almacenar y recuperar datos en persistencia local', async () => {
    const mockItems = [{ item_id: 'AK-47 | Asiimov', current_price: 120.5 }];
    await service.setCache('http://localhost/api.php?table=market_items', mockItems);

    const cached = await service.getCache('http://localhost/api.php?table=market_items');
    expect(cached).toEqual(mockItems);
  });

  it('debe registrar y recuperar la marca de tiempo de última sincronización', async () => {
    const timestamp = '2026-10-16T12:00:00.000Z';
    await service.setLastSyncTime(timestamp);

    const stored = await service.getLastSyncTime();
    expect(stored).toBe(timestamp);
  });

  it('debe aplicar escrituras optimistas (POST, PUT, DELETE) sobre la caché local en modo offline', async () => {
    const tableUrl = 'http://localhost/api.php?table=user_inventory';
    await service.setCache(tableUrl, [{ id: 1, item_id: 'AWP | Redline', quantity: 1 }]);

    // POST optimista
    await service.applyOptimisticWrite('POST', tableUrl, { id: 2, item_id: 'M4A4 | Howl', quantity: 1 });
    let list = await service.getCache<any[]>(tableUrl);
    expect(list?.length).toBe(2);
    expect(list?.[1].item_id).toBe('M4A4 | Howl');
    expect(list?.[1]._offlinePending).toBeTrue();

    // PUT optimista
    await service.applyOptimisticWrite('PUT', `${tableUrl}&id=2`, { quantity: 3 });
    list = await service.getCache<any[]>(tableUrl);
    expect(list?.find(x => x.id === 2)?.quantity).toBe(3);

    // DELETE optimista
    await service.applyOptimisticWrite('DELETE', `${tableUrl}&id=1`, null);
    list = await service.getCache<any[]>(tableUrl);
    expect(list?.length).toBe(1);
    expect(list?.[0].id).toBe(2);
  });
});
