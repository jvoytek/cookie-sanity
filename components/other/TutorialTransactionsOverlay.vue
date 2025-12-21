<script setup>
  const tutorialStore = useTutorialStore();

  const dismiss = () => {
    tutorialStore.dismissTutorial();
  };

  const goToTroopInventory = () => {
    navigateTo('/troop-inventory');
  };
</script>

<template>
  <div
    v-if="
      tutorialStore.tutorialActive &&
      tutorialStore.currentStep === 'transactions'
    "
    class="fixed inset-0 z-[1200] pointer-events-none"
  >
    <!-- Semi-transparent backdrop -->
    <div
      class="absolute inset-0 bg-surface-900/80 dark:bg-surface-950/90 backdrop-blur-sm pointer-events-auto"
      @click="dismiss"
    />

    <!-- Tutorial content -->
    <div
      class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
    >
      <div
        class="bg-surface-0 dark:bg-surface-900 p-6 rounded-lg shadow-2xl max-w-md border-2 border-primary"
      >
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <i class="pi pi-arrow-right-arrow-left text-4xl text-primary" />
          </div>
          <div class="flex-1">
            <h3
              class="text-xl font-semibold mb-2 text-surface-900 dark:text-surface-0"
            >
              Add Troop Transactions 📦
            </h3>
            <p class="text-surface-600 dark:text-surface-400 mb-4">
              Perfect! Now you can start tracking your troop inventory by adding
              initial transactions (cookies received from council).
            </p>
            <div class="flex gap-2">
              <Button
                label="Go to Troop Inventory"
                icon="pi pi-arrow-right"
                @click="goToTroopInventory"
              />
              <Button
                label="Dismiss"
                icon="pi pi-times"
                severity="secondary"
                variant="outlined"
                @click="dismiss"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
