<script setup lang="ts">
  const boothsStore = useBoothsStore();
  const { formatCurrency } = useFormatHelpers();
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
        <Column field="data.predicted" header="Estimated">
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

      <!-- Cash Receipts Section -->
      <div class="mt-4 border-t pt-4">
        <h3 class="text-lg font-semibold mb-3">Cash Received</h3>
        <p class="text-sm mb-3 text-gray-600">
          Enter cash received either as a total or as a breakdown of bills and
          coins.
        </p>

        <!-- Bills Section -->
        <div class="mb-4">
          <h4 class="text-md font-medium mb-2">Bills</h4>
          <div class="grid grid-cols-3 gap-3">
            <div class="flex flex-col">
              <label for="ones" class="text-sm mb-1">$1</label>
              <InputNumber
                id="ones"
                v-model="boothsStore.cashBreakdown.ones"
                :min="0"
                :use-grouping="false"
                input-class="w-full"
                placeholder="0"
              />
            </div>
            <div class="flex flex-col">
              <label for="fives" class="text-sm mb-1">$5</label>
              <InputNumber
                id="fives"
                v-model="boothsStore.cashBreakdown.fives"
                :min="0"
                :use-grouping="false"
                input-class="w-full"
                placeholder="0"
              />
            </div>
            <div class="flex flex-col">
              <label for="tens" class="text-sm mb-1">$10</label>
              <InputNumber
                id="tens"
                v-model="boothsStore.cashBreakdown.tens"
                :min="0"
                :use-grouping="false"
                input-class="w-full"
                placeholder="0"
              />
            </div>
            <div class="flex flex-col">
              <label for="twenties" class="text-sm mb-1">$20</label>
              <InputNumber
                id="twenties"
                v-model="boothsStore.cashBreakdown.twenties"
                :min="0"
                :use-grouping="false"
                input-class="w-full"
                placeholder="0"
              />
            </div>
            <div class="flex flex-col">
              <label for="fifties" class="text-sm mb-1">$50</label>
              <InputNumber
                id="fifties"
                v-model="boothsStore.cashBreakdown.fifties"
                :min="0"
                :use-grouping="false"
                input-class="w-full"
                placeholder="0"
              />
            </div>
            <div class="flex flex-col">
              <label for="hundreds" class="text-sm mb-1">$100</label>
              <InputNumber
                id="hundreds"
                v-model="boothsStore.cashBreakdown.hundreds"
                :min="0"
                :use-grouping="false"
                input-class="w-full"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <!-- Coins Section -->
        <div class="mb-4">
          <h4 class="text-md font-medium mb-2">Coins</h4>
          <div class="flex flex-col max-w-xs">
            <label for="cents" class="text-sm mb-1">Cents</label>
            <InputNumber
              id="cents"
              v-model="boothsStore.cashBreakdown.cents"
              :min="0"
              :max-fraction-digits="2"
              :use-grouping="false"
              mode="decimal"
              input-class="w-full"
              placeholder="0.00"
            />
          </div>
        </div>

        <!-- Total Cash -->
        <div
          class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex justify-between items-center"
        >
          <span class="font-semibold text-lg">Total Cash Receipts:</span>
          <span class="text-xl font-bold text-green-600 dark:text-green-400">
            {{ formatCurrency(boothsStore.totalCashReceipts) }}
          </span>
        </div>
      </div>
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
