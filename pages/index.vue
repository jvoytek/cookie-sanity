<script setup lang="ts">
  import InventoryProjectionChart from '@/components/inventory/InventoryProjectionChart.vue';
  import TroopInventoryChart from '@/components/inventory/TroopInventoryChart.vue';
</script>

<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12">
      <TroopInventoryChart />
    </div>
    <div class="col-span-12">
      <InventoryProjectionChart />
    </div>
  </div>
</template>
