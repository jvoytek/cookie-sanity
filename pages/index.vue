<script setup lang="ts">
  import InventoryProjectionChart from '@/components/inventory/InventoryProjectionChart.vue';
  import PackagesDistributedChart from '@/components/inventory/PackagesDistributedChart.vue';
</script>

<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12">
      <InventoryProjectionChart />
    </div>
    <div class="col-span-12">
      <PackagesDistributedChart />
    </div>
  </div>
</template>
