import type { Database, Json } from "./supabase";
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Girl = Database["public"]["Tables"]["sellers"]["Row"];
export type Cookie = Database["public"]["Tables"]["cookies"]["Row"];
export type User = Database["public"]["Tables"]["profiles"]["Row"];
export type Upload = Database["public"]["Tables"]["uploads"]["Row"];
export type Season = Database["public"]["Tables"]["seasons"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type BoothSale = Database["public"]["Tables"]["booth_sales"]["Row"];

export type SCOrder2025 = {
  DATE: string;
  "ORDER #": number;
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
  "TOTAL $": number;
};

export type NewOrder = {
  order_date: string | null;
  order_num: string | null;
  cookies: Json | null;
  to: number | null;
  from: number | null;
  profile: string | null;
  supplier: string | null;
  season: number | null;
  type: "order" | "distribution" | "return" | "transfer" | "other";
  status: "pending" | "complete" | "canceled";
};

export interface AccountBalance {
  girl: Girl;
  distributedValue: number;
  paymentsReceived: number;
  balance: number;
  status: string;
  numCookiesDistributed: number;
  cookieTotals: Record<string, number>;
  estimatedSales: Record<string, number>;
  girlPaymentsList: Payment[];
}

export interface TroopAccountSummary {
  totalDistributedValue: number;
  totalPaymentsReceived: number;
  troopBalance: number;
  estimatedTotalSales: number;
  numCookiesDistributed: number;
  numCookiesRemaining: number;
  activeAccounts: number;
}

