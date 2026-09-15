export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string; // Contraseña enviada en registro
  password_hash?: string; // Hash que devuelve la BD
  created_at?: string;
}

export interface MarketItem {
  item_id: string;
  name: string;
  image_url?: string;
  current_price?: number;
  last_updated?: string;
}

export interface UserInventory {
  id?: number;
  user_id: number;
  item_id: string;
  purchase_price: number;
  quantity?: number;
  added_at?: string;
}

export interface PriceAlert {
  id?: number;
  user_id: number;
  item_id: string;
  target_price: number;
  is_active?: boolean;
  created_at?: string;
}
