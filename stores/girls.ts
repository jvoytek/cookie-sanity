import type { Database } from '@/types/supabase';
import type { Girl } from "@/types/types";

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useGirlsStore = defineStore('girls', () => {

    const supabaseClient = useSupabaseClient<Database>();
    const user = useSupabaseUser();
    const toast = useToast();
    const profileStore = useProfileStore();
    const seasonsStore = useSeasonsStore();

    /* State */
    const allGirls = ref<Girl[]>([]);

    /* Computed */


    /* Private Functions */
    const _updateGirl = (girl: Girl) =>{
        //
        const index = allGirls.value.findIndex(c => c.id === girl.id);
        if (index !== -1) {
            allGirls.value[index] = girl;
        }
    }

    const _sortGirls = () => {
        allGirls.value.sort((a, b) => (a.first_name < b.first_name) ? -1 : (a.first_name > b.first_name) ? 1 : 0);
    }

    const _addGirl = (girl: Girl) => {
        allGirls.value.push(girl)
    }

    const _removeGirl = (girl: Girl) => {
        const index = allGirls.value.findIndex(c => c.id === girl.id);
        if (index !== -1) {
            allGirls.value.splice(index, 1);
        }
    }

    /* Actions */

    const fetchGirls = async () => {
        try {
            if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id) return;

            const { data, error } = await supabaseClient.from('sellers').select(`*`).eq("profile", profileStore.currentProfile.id).eq("season", seasonsStore.currentSeason.id).order("first_name");
            if (error) throw error;
            allGirls.value = data ?? [];
        } catch (error) {
            toast.add({
                severity: "error",
                summary: "Error",
                detail: (error as Error).message,
                life: 3000,
              });
        }
    }

    const insertGirl= async (girl: Girl) => {
        girl.profile = user.value.id;
        try {
            const { data, error } = await supabaseClient
            .from("sellers")
            .insert(girl).select().single();
    
            if (error) throw error;
    
            _addGirl(data as Girl);
            _sortGirls();

            toast.add({
            severity: "success",
            summary: "Successful",
            detail: "Girl Created",
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

    const upsertGirl = async (girl: Girl) => {
        try {
            const { error } = await supabaseClient.from("sellers").upsert(girl);
    
            if (error) throw error;
    
            _updateGirl(girl);
            _sortGirls();

            toast.add({
                severity: "success",
                summary: "Successful",
                detail: "Girl Updated",
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

    const deleteGirl = async (girl: Girl) => {
        try {
            const { error } = await supabaseClient
                .from("sellers")
                .delete()
                .eq("id", girl.id);
        
            if (error) throw error;
        
            _removeGirl(girl);
            
            toast.add({
                severity: "success",
                summary: "Successful",
                detail: "Girl Deleted",
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

    //fetchGirls();

    return { fetchGirls, allGirls, insertGirl, upsertGirl, deleteGirl }
  });