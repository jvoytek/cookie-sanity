<script setup lang="ts">
  const boothsStore = useBoothsStore();
  const notificationHelpers = useNotificationHelpers();

  async function deleteBoothSale() {
    try {
      boothsStore.deleteBoothSale(boothsStore.activeBoothSale);
      boothsStore.deleteBoothSaleDialogVisible = false;
      boothsStore.setActiveBoothSale(null);
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  }
</script>
<template>
  <Dialog
    v-model:visible="boothsStore.deleteBoothSaleDialogVisible"
    :style="{ width: '450px' }"
    header="Confirm"
    :modal="true"
  >
    <div class="flex items-center gap-4">
      <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
      <span v-if="boothsStore.activeBoothSale">
        Are you sure you want to delete the booth sale at
        <b>{{ boothsStore.activeBoothSale.location }}</b> on
        <b><NuxtTime :datetime="boothsStore.activeBoothSale.sale_date" /></b>?
      </span>
    </div>
    <template #footer>
      <Button
        label="No"
        icon="pi pi-times"
        text
        @click="deleteBoothSaleDialog = false"
      />
      <Button label="Yes" icon="pi pi-check" @click="deleteBoothSale" />
    </template>
  </Dialog>
</template>
