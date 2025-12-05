import type { Database } from './supabase';

export type PermissionLevel = 'none' | 'view' | 'request' | 'edit';

export type Order = Database['public']['Tables']['orders']['Row'] & {
  auto_calculate_cookies?: boolean;
  total_cookies?: number;
  sortDate?: Date;
};
export type Girl = Database['public']['Tables']['sellers']['Row'];
export type Cookie = Database['public']['Tables']['cookies']['Row'];
export type User = Database['public']['Tables']['profiles']['Row'];
export type Upload = Database['public']['Tables']['uploads']['Row'];
export type Season = Database['public']['Tables']['seasons']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type Deposit = Database['public']['Tables']['deposits']['Row'];
export type BoothSale = Database['public']['Tables']['booth_sales']['Row'] & {
  auto_calculate_predicted_cookies?: boolean;
  sale_date_date?: Date;
};
export type InventoryCheck =
  Database['public']['Tables']['inventory_checks']['Row'];
export type SeasonCollaborator =
  Database['public']['Tables']['season_collaborators']['Row'];

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

export interface GirlAccountSummary {
  girl: Girl;
  distributedValue: number;
  paymentsReceived: number;
  balance: number;
  status: string;
  totalAllCookiesDistributed: number;
  totalDirectShipCookies: number;
  totalVirtualCookiesDistributed: number;
  totalPhysicalCookiesDistributed: number;
  cookieTotalsByVariety: Record<string, number>;
  estimatedSales: number;
  girlPaymentsList: Payment[];
  cookieSummary: CookieSummary;
}

export interface CookieSummary {
  directShipped: Record<string, number>;
  directShippedTotals: Record<string, number>;
  countDirectShipped: number;
  girlDelivery: Record<string, number>;
  girlDeliveryTotals: Record<string, number>;
  countGirlDelivery: number;
  boothSales: Record<string, number>;
  boothSalesTotals: Record<string, number>;
  countBoothSales: number;
  virtualBoothSales: Record<string, number>;
  virtualBoothSalesTotals: Record<string, number>;
  countVirtualBoothSales: number;
  countAllPackages: number;
  totalDue: number;
}

export interface TroopAccountSummary {
  totalDistributedValue: number;
  totalPaymentsReceived: number;
  troopBalance: number;
  estimatedTotalSales: number;
  totalAllCookiesDistributed: number;
  totalGirlDelivery: number;
  totalCookiesRemaining: number;
  cookieSummary: CookieSummary;
}

export interface InventoryEvent {
  date: string;
  type: 'T2G' | 'T2G(B)' | 'T2G(VB)' | 'G2T' | 'C2T' | 'T2T' | 'G2G' | 'BOOTH';
  transaction?: Order;
  boothSale?: BoothSale;
  cookies: Record<string, number>;
  description: string;
}
export interface SmartCookiesPayment {
  District?: string;
  'Service Unit'?: string;
  Troop?: string;
  Girl: string;
  Date: string;
  'Payment Method': string;
  Amount: number | string;
  'Ref #'?: string;
}
