<script setup>
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
  <div class="col-span-12">
    <div class="card">
      <form @submit.prevent="updateProfile">
        <div class="font-semibold text-xl">Account</div>
        <div class="flex flex-col gap-2">
          <label for="email">Email</label>
          <InputText id="email" type="text" :value="user.email" disabled />
        </div>
        <div class="flex flex-col gap-2">
          <label for="display_name">Display Name</label>
          <InputText
            id="display_name"
            v-model="profileStore.display_name"
            type="text"
          />
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
