<script setup lang="ts">
  import InventoryProjectionChart from '@/components/inventory/InventoryProjectionChart.vue';
  import NextBoothSaleWidget from '@/components/inventory/NextBoothSaleWidget.vue';
</script>

<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12">
      <InventoryProjectionChart />
    </div>
    <div class="col-span-12">
      <NextBoothSaleWidget />
    </div>
  </div>
</template>
