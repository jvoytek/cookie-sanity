<script setup>
  const seasonsStore = useSeasonsStore();

  const hasNoSeasons = computed(() => {
    return !seasonsStore.currentSeason?.id;
  });
</script>

<template>
  <div
    v-if="hasNoSeasons"
    class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
  >
    <div
      class="absolute inset-0 bg-surface-900/70 dark:bg-surface-950/80 backdrop-blur-sm"
    />
    <div
      class="relative bg-surface-0 dark:bg-surface-900 p-8 rounded-lg shadow-2xl max-w-md pointer-events-auto"
    >
      <div class="text-center">
        <i class="pi pi-info-circle text-6xl text-primary mb-4" />
        <h2
          class="text-2xl font-semibold mb-3 text-surface-900 dark:text-surface-0"
        >
          No Seasons Available
        </h2>
        <p class="text-surface-600 dark:text-surface-400 mb-6">
          Create a season in the settings page to access the application
          features.
        </p>
        <Button
          label="Go to Settings"
          icon="pi pi-cog"
          @click="$router.push('/settings')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* Ensure the overlay appears above the sidebar */
  .z-50 {
    z-index: 1100;
  }
</style>
