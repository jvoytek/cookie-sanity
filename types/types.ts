import type { Database } from './supabase';
export type Order = Database['public']['Tables']['orders']['Row'];
export type Girl = Database['public']['Tables']['sellers']['Row'];
export type Cookie = Database['public']['Tables']['cookies']['Row'];
