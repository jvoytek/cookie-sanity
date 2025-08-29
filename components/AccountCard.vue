<script setup>
import Avatar from "~/components/AvatarUpload.vue";

const loading = ref(true);

loading.value = true;
const user = useSupabaseUser();

const profileStore = useProfileStore();

loading.value = false;

async function updateProfile() {
  try {
    loading.value = true;
    profileStore.updateProfile();
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
        <Avatar
          v-model:path="profileStore.avatar_url"
          @upload="updateProfile"
        />
        <div class="flex flex-col gap-2">
          <label for="email">Email</label>
          <InputText id="email" type="text" :value="user.email" disabled />
        </div>
        <div class="flex flex-col gap-2">
          <label for="username">Name</label>
          <InputText
            id="username"
            v-model="profileStore.username"
            type="text"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label for="website">Website</label>
          <InputText id="website" v-model="profileStore.website" type="url" />
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
