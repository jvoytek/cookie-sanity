import type { Database } from './supabase';
export type Order = Database['public']['Tables']['orders']['Row'];
export type Girl = Database['public']['Tables']['sellers']['Row'];
export type Cookie = Database['public']['Tables']['cookies']['Row'];
export type User = Database['public']['Tables']['profiles']['Row'];
export type Upload = Database['public']['Tables']['uploads']['Row'];
export type SCOrder2025 = {
    "DATE": number,
    "ORDER #": number,
    "TYPE": string,
    "TO": string,
    "FROM": number,
    "CShare": number,
    "ADV": number,
    "TY": number,
    "LEM": number,
    "TRE": number,
    "TM": number,
    "PBP": number,
    "CD": number,
    "PBS": number,
    "GFC": number,
    "STATUS":string,
    "TOTAL": number,
    "TOTAL $": number,
  }