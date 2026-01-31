<script setup>
  import AppMenu from './AppMenu.vue';
  const { isParent, parentChildren, selectedChildId, setSelectedChild } = useUserRole();
  const girlsStore = useGirlsStore();

  // Compute options for child selector
  const childOptions = computed(() => {
    if (!isParent.value || !parentChildren.value) return [];
    return parentChildren.value.map((childId) => {
      const girl = girlsStore.getGirlById(childId);
      return {
        label: girl ? girlsStore.getGirlNameById(childId) : `Girl ${childId}`,
        value: childId,
      };
    });
  });

  // Show dropdown only if parent has more than 1 child
  const showChildSelector = computed(() => {
    return isParent.value && childOptions.value.length > 1;
  });

  const onChildChange = (event: any) => {
    setSelectedChild(event.value);
  };
</script>

<template>
  <div class="layout-sidebar relative">
    <!-- Child Selector for Parents -->
    <div v-if="showChildSelector" class="p-4 border-b border-surface-200 dark:border-surface-700">
      <label class="block mb-2 text-sm font-semibold">Select Child</label>
      <Select
        v-model="selectedChildId"
        :options="childOptions"
        option-label="label"
        option-value="value"
        placeholder="Select a girl"
        class="w-full"
        @change="onChildChange"
      />
    </div>
    <app-menu />
    <NoSeasonOverlay />
  </div>
</template>

<style lang="scss" scoped></style>
