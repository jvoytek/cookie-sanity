import type { Database } from './supabase';
export type Order = Database['public']['Tables']['orders']['Row'] & {
  sortDate?: Date;
};
export type Girl = Database['public']['Tables']['sellers']['Row'];
export type Cookie = Database['public']['Tables']['cookies']['Row'];
export type User = Database['public']['Tables']['profiles']['Row'];
export type Upload = Database['public']['Tables']['uploads']['Row'];
export type Season = Database['public']['Tables']['seasons']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type BoothSale = Database['public']['Tables']['booth_sales']['Row'] & {
  auto_calculate_predicted_cookies?: boolean;
  sale_date_date?: Date;
};
export type InventoryCheck =
  Database['public']['Tables']['inventory_checks']['Row'];

export type SCOrder2025 = {
  DATE: string;
  'ORDER #': number;
  TYPE: string;
  TO: string;
  FROM: string;
  CShare: number;
  ADV: number;
  TY: number;
  LEM: number;
  TRE: number;
  TM: number;
  PBP: number;
  CD: number;
  PBS: number;
  GFC: number;
  STATUS: string;
  TOTAL: number;
  'TOTAL $': number;
};

export type NewOrder = Partial<Order>;

export interface AccountBalance {
  girl: Girl;
  distributedValue: number;
  paymentsReceived: number;
  balance: number;
  status: string;
  numCookiesDistributed: number;
  cookieTotals: Record<string, number>;
  estimatedSales: number;
  girlPaymentsList: Payment[];
}

export interface TroopAccountSummary {
  totalDistributedValue: number;
  packagesDistributedByType: Record<string, number>;
  totalPaymentsReceived: number;
  troopBalance: number;
  estimatedTotalSales: number;
  numCookiesDistributed: number;
  numCookiesRemaining: number;
  activeAccounts: number;
}

export interface InventoryEvent {
  date: string;
  type: 'T2G' | 'G2T' | 'C2T' | 'T2T' | 'G2G' | 'BOOTH';
  transaction?: Order;
  boothSale?: BoothSale;
  cookies: Record<string, number>;
  description: string;
}
