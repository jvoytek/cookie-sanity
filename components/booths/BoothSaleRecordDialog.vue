<script setup lang="ts">
  const boothsStore = useBoothsStore();
</script>
<template>
  <Dialog
    v-model:visible="boothsStore.recordSalesDialogVisible"
    :style="{ width: '650px' }"
    header="Record Booth Sales"
    :modal="true"
    @after-hide="boothsStore.closeRecordSalesDialog"
  >
    <div class="flex flex-col gap-4">
      <p class="mb-2">
        Enter the remaining packages after the booth sale. Sales will be
        automatically calculated.
      </p>
      <DataTable
        :value="boothsStore.orderedActiveBoothSalesRecordData"
        size="small"
      >
        <Column field="name" header="Cookie">
          <template #body="slotProps">
            <div class="flex items-center gap-2">
              <span
                class="w-3 h-3 rounded-full flex-shrink-0"
                :style="{
                  backgroundColor: slotProps.data.color || '#888',
                }"
              />
              <span>{{ slotProps.data.name }}</span>
            </div>
          </template>
        </Column>
        <Column field="data.predicted" header="Predicted">
          <template #body="slotProps">
            <InputNumber
              v-model="slotProps.data.data.predicted"
              :min="0"
              @update:model-value="
                (val) =>
                  boothsStore.updateSalesRecordPredicted(
                    slotProps.data.abbreviation,
                    val || 0,
                  )
              "
              input-class="w-16"
            />
          </template>
        </Column>
        <Column field="data.remaining" header="Remaining">
          <template #body="slotProps">
            <InputNumber
              v-model="slotProps.data.data.remaining"
              :min="0"
              @update:model-value="
                (val) =>
                  boothsStore.updateSalesRecordRemaining(
                    slotProps.data.abbreviation,
                    val || 0,
                  )
              "
              input-class="w-16"
            />
          </template>
        </Column>
        <Column field="data.sales" header="Sales">
          <template #body="slotProps">
            <InputNumber
              v-model="slotProps.data.data.sales"
              :min="0"
              @update:model-value="
                (val) =>
                  boothsStore.updateSalesRecordSales(
                    slotProps.data.abbreviation,
                    val || 0,
                  )
              "
              input-class="w-16"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        outlined
        @click="boothsStore.closeRecordSalesDialog"
      />
      <Button
        label="Save"
        icon="pi pi-check"
        @click="boothsStore.saveRecordedSales"
      />
    </template>
  </Dialog>
</template>
