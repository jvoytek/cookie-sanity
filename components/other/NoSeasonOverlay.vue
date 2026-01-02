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
    class="absolute inset-0 z-[1000] flex items-center justify-center bg-surface-300/60 backdrop-blur-sm rounded-lg"
  >
    <div class="text-center p-6 max-w-xs">
      <i class="pi pi-lock text-4xl mb-3 text-surface-600" />
      <p class="text-surface-600 font-medium">No seasons exist</p>
      <p class="text-surface-600 mt-2">
        Add a new season on the
        <a
          href="/settings"
          class="text-primary-500 no-underline hover:underline"
          >Settings page</a
        >
        to get started.
      </p>
    </div>
  </div>
</template>
