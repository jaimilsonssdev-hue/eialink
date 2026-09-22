export interface WaiterProfile {
  id: string;
  name: string;
  pin: string; // 4 dígitos
  card_code: string; // Código único do cartão NFC / QR Code (ex: "garcom-carlos")
  active: boolean;
  phone?: string | null;
  color?: string;
}

export interface TableItem {
  id: string;
  number: string; // Ex: "01", "02", "Balcão", "VIP"
  card_code: string; // Ex: "mesa-01"
  assigned_waiter_id?: string | null;
  active: boolean;
}

export interface ComandaSettings {
  enabled: boolean;
  mode: "waiter" | "kitchen_direct"; // "waiter": Garçom confere e envia | "kitchen_direct": direto para a cozinha
  allow_call_waiter: boolean;
  call_options: string[];
  waiters: WaiterProfile[];
  tables: TableItem[];
}

export interface ComandaItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  notes?: string;
}

export type ComandaOrderStatus =
  | "pending_waiter" // Aguardando aprovação do garçom
  | "in_kitchen"     // Na cozinha / em preparo
  | "ready"          // Pronto para levar à mesa
  | "delivered"      // Entregue ao cliente
  | "cancelled";     // Cancelado

export interface ComandaOrder {
  id: string;
  bio_page_id: string;
  table_number: string;
  waiter_id?: string | null;
  waiter_name?: string | null;
  items: ComandaItem[];
  total: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  status: ComandaOrderStatus;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export type WaiterCallStatus = "calling" | "attended" | "cancelled";

export interface WaiterCall {
  id: string;
  bio_page_id: string;
  table_number: string;
  waiter_id?: string | null;
  waiter_name?: string | null;
  reason: string;
  status: WaiterCallStatus;
  created_at: string;
  attended_at?: string;
}

