<script setup>
  const loading = ref(true);

  loading.value = true;
  const user = useSupabaseUser();

  const profileStore = useProfileStore();
  const copyToClipboard = ref(false);

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

  async function copyProfileId() {
    if (user.value?.id) {
      await navigator.clipboard.writeText(user.value.id);
      copyToClipboard.value = true;
      setTimeout(() => {
        copyToClipboard.value = false;
      }, 2000);
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
          <label for="profile_id">Profile ID</label>
          <div class="flex gap-2">
            <InputText
              id="profile_id"
              type="text"
              :value="user.id"
              disabled
              class="flex-1"
            />
            <Button
              type="button"
              :icon="copyToClipboard ? 'pi pi-check' : 'pi pi-copy'"
              :label="copyToClipboard ? 'Copied!' : 'Copy'"
              severity="secondary"
              @click="copyProfileId"
            />
          </div>
          <small class="text-surface-500 dark:text-surface-400"
            >Share this ID with season owners to be invited as a
            collaborator.</small
          >
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
