<script setup lang="ts">
  const user = useSupabaseUser();

  watch(
    user,
    async () => {
      if (user.value) {
        await useProfileStore().fetchProfile(); // Ensure profile is loaded before redirecting
        // Redirect to protected page
        await navigateTo('/');
      }
    },
    { immediate: true },
  );
</script>

<template>
  <div>Waiting for login...</div>
</template>
