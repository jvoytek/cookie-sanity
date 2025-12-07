<script setup lang="ts">
  import DashboardQuickNumbers from '@/components/inventory/DashboardQuickNumbers.vue';
  import InventoryProjectionChart from '@/components/inventory/InventoryProjectionChart.vue';
</script>

<template>
  <div>
    <DashboardQuickNumbers />
    <div class="grid grid-cols-12 gap-8">
      <div class="col-span-12">
        <InventoryProjectionChart />
      </div>
    </div>
  </div>
</template>
