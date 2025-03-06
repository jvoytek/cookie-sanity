import type { Database } from '@/types/supabase';
import type { Cookie } from "@/types/types";

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useCookiesStore = defineStore('cookies', () => {

    const supabaseClient = useSupabaseClient<Database>();
    const user = useSupabaseUser();
    const toast = useToast();

    /* State */
    const allCookies = ref<Cookie[]>([]);

    /* Computed */


    /* Private Functions */

    const _updateCookie = (cookie: Cookie) =>{
        //
        const index = allCookies.value.findIndex(c => c.id === cookie.id);
        if (index !== -1) {
            allCookies.value[index] = cookie;
        }
    }

    const _sortCookies = () => {
        allCookies.value.sort((a, b) => a.order - b.order);
    }

    const _addCookie = (cookie: Cookie) => {
        allCookies.value.push(cookie)
    }

    const _removeCookie = (cookie: Cookie) => {
        const index = allCookies.value.findIndex(c => c.id === cookie.id);
        if (index !== -1) {
            allCookies.value.splice(index, 1);
        }
    }


    
    /* Actions */

    const fetchCookies = async () => {
        try {
            const { data, error } = await supabaseClient.from('cookies').select(`*`).eq("profile", user.value.id).order("order");
            if (error) throw error;
            allCookies.value = data ?? [];
        } catch (error) {
            toast.add({
                severity: "error",
                summary: "Error",
                detail: (error as Error).message,
                life: 3000,
              });
        }
    }

    const insertCookie = async (cookie: Cookie) => {
        cookie.profile = user.value.id;
        try {
          const { data, error } = await supabaseClient
            .from("cookies")
            .insert(cookie).select().single();
  
          if (error) throw error;
  
          _addCookie(data as Cookie);
          _sortCookies();

          toast.add({
            severity: "success",
            summary: "Successful",
            detail: "Cookie Created",
            life: 3000,
          });
        } catch (error) {
          toast.add({
            severity: "error",
            summary: "Error",
            detail: error.message,
            life: 3000,
          });
        }
    }

    const upsertCookie = async (cookie: Cookie) => {
        try {
            const { error } = await supabaseClient.from("cookies").upsert(cookie);
    
            if (error) throw error;
    
            _updateCookie(cookie);
            _sortCookies();

            toast.add({
              severity: "success",
              summary: "Successful",
              detail: "Product Updated",
              life: 3000,
            });
          } catch (error) {
            toast.add({
              severity: "error",
              summary: "Error",
              detail: error.message,
              life: 3000,
            });
          }    
    }

    const deleteCookie = async (cookie: Cookie) => {
        try {
            const { error } = await supabaseClient
              .from("cookies")
              .delete()
              .eq("id", cookie.id);
        
            if (error) throw error;
        
            _removeCookie(cookie);
            reorderCookies(allCookies.value);
        
            toast.add({
              severity: "success",
              summary: "Successful",
              detail: "Cookie Deleted",
              life: 3000,
            });
          } catch (error) {
            toast.add({
              severity: "error",
              summary: "Error",
              detail: error.message,
              life: 3000,
            });
          }
    }

    const reorderCookies = async (cookies: Cookie[]) => {
        cookies.forEach((cookie, i) => {
            const index = allCookies.value.findIndex(c => c.id === cookie.id);
            allCookies.value[index].order = i;
        });
        
        _sortCookies();

        try {
            const { error } = await supabaseClient.from("cookies").upsert(allCookies.value);
            if (error) throw error;
            toast.add({
                severity: "success",
                summary: "Cookies Reordered",
                life: 3000,
            });
        } catch (error) {
            toast.add({
                severity: "error",
                summary: "Error",
                detail: error.message,
                life: 3000,
            });
        }
    }



    

    fetchCookies();
  
    return { allCookies, fetchCookies, insertCookie, upsertCookie, deleteCookie, reorderCookies }
  });