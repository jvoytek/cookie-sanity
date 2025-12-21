<script setup>
  const tutorialStore = useTutorialStore();

  onMounted(() => {
    // Start tutorial if appropriate
    tutorialStore.startTutorial();
  });
</script>

<template>
  <div class="grid grid-cols-12 gap-8">
    <AccountCard />
    <SeasonSettings />
  </div>
</template>
