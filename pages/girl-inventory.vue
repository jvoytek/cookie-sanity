<script setup>
  const cookiesStore = useCookiesStore();
  const girlsStore = useGirlsStore();
  const user = useSupabaseUser();
  const showGirlsOverlay = computed(() => {
    return user.value && girlsStore.allGirls.length === 0;
  });
</script>
<template>
  <div class="grid grid-cols-12 gap-8 relative">
    <GirlInventoryTabs />
    <NoGirlsOverlay v-if="showGirlsOverlay" />
    <NoCookiesOverlay v-else />
  </div>
</template>
