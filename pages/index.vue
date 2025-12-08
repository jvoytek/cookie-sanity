<template>
  <div>
    <DashboardQuickNumbers />
    <div class="grid grid-cols-12 gap-8">
      <div class="col-span-12 mb-8">
        <InventoryProjectionChart />
      </div>
    </div>
    <div class="grid grid-cols-12 gap-8">
      <PackagesDistributedChart class="col-span-12 md:col-span-4" />
      <NextBoothSaleWidget class="col-span-12 md:col-span-4" />
    </div>
  </div>
</template>
