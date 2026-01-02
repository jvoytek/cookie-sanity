<script setup>
  const girlsStore = useGirlsStore();
  const user = useSupabaseUser();
  const showOverlay = computed(() => {
    return user.value && girlsStore.allGirls.length === 0;
  });
</script>
<template>
  <div
    v-if="showOverlay"
    class="absolute inset-0 z-[1000] flex items-center justify-center bg-surface-300/60 backdrop-blur-sm rounded-lg"
  >
    <div class="text-center p-6 max-w-xs">
      <i class="pi pi-lock text-4xl mb-3 text-surface-600" />
      <p class="text-surface-600 font-medium">
        No girls have been added to this season
      </p>
      <p class="text-surface-600 mt-2">
        Add a girls in
        <a href="/girls" class="text-primary-500 no-underline hover:underline"
          >Season Settings: Girls page</a
        >
        to get started.
      </p>
    </div>
  </div>
</template>
