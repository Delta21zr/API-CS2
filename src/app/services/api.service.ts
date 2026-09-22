import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, MarketItem, UserInventory, PriceAlert } from '../interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost/api.php'; 

  constructor(private http: HttpClient) {}

  // ==========================
  // MÉTODOS GENÉRICOS
  // ==========================
  private getAll<T>(table: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.apiUrl}?table=${table}`);
  }
  private getOne<T>(table: string, id: number | string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}?table=${table}&id=${id}`);
  }
  private create<T>(table: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}?table=${table}`, data);
  }
  private update<T>(table: string, id: number | string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}?table=${table}&id=${id}`, data);
  }
  private remove(table: string, id: number | string): Observable<any> {
    return this.http.delete(`${this.apiUrl}?table=${table}&id=${id}`);
  }

  // ==========================
  // USERS
  // ==========================
  getUsers() { return this.getAll<User>('users'); }
  getUser(id: number) { return this.getOne<User>('users', id); }
  createUser(user: User) { return this.create('users', user); }
  updateUser(id: number, user: User) { return this.update('users', id, user); }
  deleteUser(id: number) { return this.remove('users', id); }

  // ==========================
  // MARKET ITEMS
  // ==========================
  getMarketItems() { return this.getAll<MarketItem>('market_items'); }
  searchMarketItems(term: string) { return this.http.get<MarketItem[]>(`${this.apiUrl}?table=market_items&search=${term}`); }
  getMarketItem(id: string) { return this.getOne<MarketItem>('market_items', id); }
  createMarketItem(item: MarketItem) { return this.create('market_items', item); }
  updateMarketItem(id: string, item: MarketItem) { return this.update('market_items', id, item); }
  deleteMarketItem(id: string) { return this.remove('market_items', id); }

  // ==========================
  // USER INVENTORY
  // ==========================
  getInventories() { return this.getAll<UserInventory>('user_inventory'); }
  getInventory(id: number) { return this.getOne<UserInventory>('user_inventory', id); }
  createInventory(item: UserInventory) { return this.create('user_inventory', item); }
  updateInventory(id: number, item: UserInventory) { return this.update('user_inventory', id, item); }
  deleteInventory(id: number) { return this.remove('user_inventory', id); }

  // ==========================
  // PRICE ALERTS
  // ==========================
  getAlerts() { return this.getAll<PriceAlert>('price_alerts'); }
  getAlert(id: number) { return this.getOne<PriceAlert>('price_alerts', id); }
  createAlert(alert: PriceAlert) { return this.create('price_alerts', alert); }
  updateAlert(id: number, alert: PriceAlert) { return this.update('price_alerts', id, alert); }
  deleteAlert(id: number) { return this.remove('price_alerts', id); }

  // ==========================
  // HISTORIAL DE PRECIOS
  // ==========================
  getPriceHistory(item_id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?table=price_history&item_id=${item_id}`);
  }
}
