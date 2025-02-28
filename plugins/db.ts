import type { Database } from '@/types/supabase';
import type { Order, Girl, Cookie } from "@/types/types";

export default defineNuxtPlugin(async () => {

  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  const db = {
    orders: () => supabaseClient.from('orders'),
    girls: () => supabaseClient.from('sellers'),
    cookies: () => supabaseClient.from('cookies'),
  };

  const { data: allOrders } = await useAsyncData<Order[]>(
    async () => {
      if (user.value) {
        const { data, error } = await db.orders().select(`*`).eq("profile", user.value.id).order("order_date", { ascending: false });
        if (error) throw error;
        return (data ?? []) as Order[];

      }
      return [] as Order[];
    }
  )
  
  const { data: allGirls } = await useAsyncData<Girl[]>(
    async () => {
    if (user.value) {
        const { data, error } = await db.girls().select(`*`).eq("profile", user.value.id).order("first_name");
        if (error) throw error;
        return (data ?? []) as Girl[];
      }
      return [] as Girl[];
    }
  );
    
  const { data: allCookies } = await useAsyncData<Cookie[]>(
    async () => {
    if (user.value) {
        const { data, error } = await db.cookies().select(`*`).eq("profile", user.value.id).order("order");
        if (error) throw error;
        return (data ?? []) as Cookie[];
      }
      return [] as Cookie[];
    }
  );

  return {
    provide: {
      db: {    
        orders: db.orders,
        girls: db.girls,
        cookies: db.cookies,
        allOrders,
        allGirls,
        allCookies,
      }
    }
  };
});