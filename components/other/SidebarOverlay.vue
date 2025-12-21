<script setup>
  const seasonsStore = useSeasonsStore();
  const user = useSupabaseUser();

  const showOverlay = computed(() => {
    return user.value && !seasonsStore.currentSeason?.id;
  });
</script>

<template>
  <div
    v-if="showOverlay"
    class="absolute inset-0 z-40 flex items-center justify-center bg-surface-900/70 dark:bg-surface-950/80 backdrop-blur-sm rounded-lg"
  >
    <div class="text-center p-6 max-w-xs">
      <i class="pi pi-lock text-4xl mb-3 text-surface-400" />
      <p class="text-surface-200 dark:text-surface-300 font-medium">
        No seasons exist
      </p>
      <p class="text-surface-300 dark:text-surface-400 text-sm mt-2">
        Add one in settings to access pages
      </p>
    </div>
  </div>
</template>

<style scoped>
  .z-40 {
    z-index: 1000;
  }
</style>
