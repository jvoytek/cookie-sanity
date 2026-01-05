<script setup lang="ts">
  import type { BoothSale } from '@/types/types';

  const boothsStore = useBoothsStore();

  function openNew() {
    boothsStore.setActiveBoothSale(null);
    boothsStore.boothDialogVisible = true;
  }
</script>

<template>
  <div class="grid grid-cols-12 gap-8 relative">
    <div class="col-span-12">
      <div class="card">
        <h5>Booth Sales</h5>
        <p>
          Schedule booth sales and predict cookie demand for inventory planning.
        </p>

        <Toolbar class="mb-6">
          <template #start>
            <Button
              label="New Booth Sale"
              icon="pi pi-plus"
              severity="secondary"
              class="mr-2"
              @click="openNew"
            />
          </template>
        </Toolbar>

        <div class="mb-4 flex items-center gap-2 float-right">
          <Checkbox
            v-model="boothsStore.showArchivedBoothSales"
            inputId="showArchived"
            :binary="true"
          />
          <label for="showArchived">Show archived booth sales</label>
        </div>

        <BoothsDataTable :value="boothsStore.visibleBoothSales" />

        <BoothSaleDialog />
        <BoothSaleDeleteDialog />
        <BoothSaleRecordDialog />
      </div>
    </div>
    <NoCookiesOverlay />
  </div>
</template>
