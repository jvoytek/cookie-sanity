<script setup>
import Avatar from "@/components/Avatar.vue";
const supabase = useSupabaseClient();

const loading = ref(true);
const username = ref("");
const website = ref("");
const avatar_path = ref("");

loading.value = true;
const user = useSupabaseUser();

const { data } = await supabase
  .from("profiles")
  .select(`username, website, avatar_url`)
  .eq("id", user.value.id)
  .single();

if (data) {
  username.value = data.username;
  website.value = data.website;
  avatar_path.value = data.avatar_url;
} else {
  console.log("no data");
}

loading.value = false;

async function updateProfile() {
  try {
    loading.value = true;
    const user = useSupabaseUser();

    const updates = {
      id: user.value.id,
      username: username.value,
      website: website.value,
      avatar_url: avatar_path.value,
      updated_at: new Date(),
    };

    const { error } = await supabase.from("profiles").upsert(updates, {
      returning: "minimal", // Don't return the value after inserting
    });

    if (error) throw error;
  } catch (error) {
    alert(error.message);
  } finally {
    loading.value = false;
  }
}

async function signOut() {
  try {
    loading.value = true;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    alert(error.message);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
    <div class="card">
      <form @submit.prevent="updateProfile">
        <div class="font-semibold text-xl">Account</div>
        <Avatar v-model:path="avatar_path" @upload="updateProfile" />
        <div class="flex flex-col gap-2">
          <label for="email">Email</label>
          <InputText id="email" type="text" :value="user.email" disabled />
        </div>
        <div class="flex flex-col gap-2">
          <label for="username">Name</label>
          <InputText id="username" v-model="username" type="text" />
        </div>
        <div class="flex flex-col gap-2">
          <label for="website">Website</label>
          <InputText id="website" v-model="website" type="url" />
        </div>
        <div class="flex flex-col gap-2">
          <Button
            type="submit"
            class="button primary block"
            :label="loading ? 'Loading ...' : 'Update'"
            :disabled="loading"
          />
        </div>
      </form>
    </div>
  </div>
</template>
