import type { Database } from '@/types/supabase';
import type { User } from "@/types/types";

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useProfileStore = defineStore('profile', () => {
    
    const supabaseClient = useSupabaseClient<Database>();
    const user = useSupabaseUser();
    const toast = useToast();

    /* State */
    const currentProfile = ref<User>();
    const username = ref<string>("");
    const website = ref<string>("");
    const avatar_url = ref<string>("");
    const avatar_src = ref<string>("");
    
    /* Computed */


    /* Private Functions */

    
    /* Actions */
    const fetchProfile = async () => {
        try {
            const { data, error } = await supabaseClient.from('profiles').select(`*`).eq("id", user?.value.id).single();
            if (error) throw error;
            currentProfile.value = data as User ?? [];
            username.value = currentProfile.value?.username ?? "";
            website.value = currentProfile.value?.website ?? "";
            avatar_url.value = currentProfile.value?.avatar_url ?? "";
            if (avatar_url.value) downloadAvatar();
        } catch (error) {
            toast.add({
                severity: "error",
                summary: "Error",
                detail: (error as Error).message,
                life: 3000,
              });
        }
    }

    const updateProfile = async () => {
        try {
        
            const updates = {
              id: user?.value.id,
              username: username.value,
              website: website.value,
              avatar_url: avatar_url.value,
            };
        
            const { error } = await supabaseClient.from("profiles").upsert(updates, {
              returning: "minimal", // Don't return the value after inserting
            });
        
            if (error) throw error;

            toast.add({
                severity: "success",
                summary: "Successful",
                detail: "Profile Updated",
                life: 3000,
              });
          } catch (error) {
            toast.add({
                severity: "error",
                summary: "Error",
                detail: (error as Error).message,
                life: 3000,
              });
          }
    }

    const uploadAvatar = async (file: File) => {
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Math.random()}.${fileExt}`;

          const filePath = `${fileName}`;
      
          const { error: uploadError } = await supabaseClient.storage
            .from("avatars")
            .upload(filePath, file);
      
          if (uploadError) throw uploadError;
            
          // Delete the old avatar
            if (avatar_url.value) {
                const { error: deleteError } = await supabaseClient.storage
                .from("avatars")
                .remove([avatar_url.value]);
                if (deleteError) throw deleteError;
            }

          avatar_url.value = filePath;
          downloadAvatar();
          updateProfile();

          toast.add({
            severity: "success",
            summary: "Successful",
            detail: "Avatar Uploaded",
            life: 3000,
          });

        } catch (error) {
            toast.add({
                severity: "error",
                summary: "Error",
                detail: (error as Error).message,
                life: 3000,
              });
        }
    }

    const downloadAvatar = async () => {
        try {
            const { data, error } = await supabaseClient.storage
              .from("avatars")
              .download(avatar_url.value);

            if (error) throw error;
            avatar_src.value = URL.createObjectURL(data);
          } catch (error) {
            toast.add({
                severity: "error",
                summary: "Error",
                detail: (error as Error).message,
                life: 3000,
              });
          }
    };

    fetchProfile();

    return { currentProfile, username, website, avatar_url, fetchProfile, updateProfile, uploadAvatar, avatar_src };
});