<script setup lang="ts">
  const boothsStore = useBoothsStore();
  const { formatCurrency } = useFormatHelpers();

  const enterRemainingPackages = ref(true);
  const packagesSold = computed(() => {
    return boothsStore.orderedActiveBoothSalesRecordData.reduce(
      (sum, item) => sum + (item.data.sales || 0),
      0,
    );
  });
  const totalSales = computed(() => {
    return boothsStore.orderedActiveBoothSalesRecordData.reduce(
      (sum, item) => sum + (item.data.sales || 0) * item.price,
      0,
    );
  });
</script>
<template>
  <Dialog
    v-model:visible="boothsStore.recordSalesDialogVisible"
    :style="{ width: '650px' }"
    header="Record Sales"
    :modal="true"
    @after-hide="boothsStore.closeRecordSalesDialog"
  >
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2">
        <ToggleSwitch
          v-model="enterRemainingPackages"
          inputId="remaining-packages-toggle"
        />
        <label for="remaining-packages-toggle"
          >Enter remaining packages and automatically calculate sales</label
        >
      </div>
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
              <span
                >{{ slotProps.data.name }} ({{
                  formatCurrency(slotProps.data.price)
                }})</span
              >
            </div>
          </template>
        </Column>
        <Column field="data.predicted" header="Estimated" />
        <Column field="data.remaining" header="Remaining">
          <template #body="slotProps">
            <InputNumber
              v-if="enterRemainingPackages"
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
            <span v-else>{{ slotProps.data.data.remaining }}</span>
          </template>
        </Column>
        <Column field="data.sales" header="Sales">
          <template #body="slotProps">
            <InputNumber
              v-if="!enterRemainingPackages"
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
            <span v-else>{{ slotProps.data.data.sales }}</span>
          </template>
        </Column>
        <ColumnGroup type="footer">
          <Row>
            <Column />
            <Column />
            <Column :footer="`Packages`" />
            <Column field="packages" :footer="packagesSold" />
          </Row>
          <Row>
            <Column />
            <Column />
            <Column :footer="`Sales`" />
            <Column field="sales" :footer="formatCurrency(totalSales)" />
          </Row>
        </ColumnGroup>
      </DataTable>

      <!-- Cash Receipts Section -->
      <div>
        <h3 class="text-lg font-semibold mb-3">Receipts</h3>
        <p>Enter money received below.</p>

        <!-- Cash -->
        <div class="mb-4">
          <h4 class="text-base font-semibold mb-2">Cash</h4>
          <div class="grid grid-cols-7 gap-3">
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
            <div class="flex flex-col">
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
        </div>

        <!-- Credit Receipts -->
        <div class="mb-4">
          <h4 class="text-base font-semibold mb-2">Credit Receipts</h4>
          <div class="flex flex-col">
            <InputNumber
              id="credit-receipts"
              v-model="boothsStore.creditReceipts"
              :min="0"
              :max-fraction-digits="2"
              mode="currency"
              currency="USD"
              locale="en-US"
              input-class="w-full"
              placeholder="0.00"
            />
          </div>
        </div>

        <!-- Other Receipts -->
        <div class="mb-4">
          <h4 class="text-base font-semibold mb-2">Other Receipts</h4>
          <div class="flex flex-col">
            <InputNumber
              id="other-receipts"
              v-model="boothsStore.otherReceipts"
              :min="0"
              :max-fraction-digits="2"
              mode="currency"
              currency="USD"
              locale="en-US"
              input-class="w-full"
              placeholder="0.00"
            />
          </div>
        </div>

        <!-- Total Cash -->
        <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
          <div class="flex justify-between items-center">
            <span class="font-semibold">Sales:</span>
            <span>
              {{ formatCurrency(totalSales) }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-semibold">Total Cash Receipts:</span>
            <span>
              {{ formatCurrency(boothsStore.totalCashReceipts) }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-semibold">Total Credit Receipts:</span>
            <span>
              {{ formatCurrency(boothsStore.creditReceipts) }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-semibold">Total Other Receipts:</span>
            <span>
              {{ formatCurrency(boothsStore.otherReceipts) }}
            </span>
          </div>
          <div
            class="flex justify-between items-center border-t border-gray-300 dark:border-gray-600 mt-2 pt-2"
          >
            <span class="font-semibold">Total Receipts:</span>
            <span>
              {{
                formatCurrency(
                  boothsStore.totalCashReceipts +
                    boothsStore.creditReceipts +
                    boothsStore.otherReceipts,
                )
              }}
            </span>
          </div>

          <div class="flex justify-between items-center">
            <span class="font-semibold">Difference:</span>
            <span>
              {{
                formatCurrency(
                  totalSales -
                    boothsStore.totalCashReceipts -
                    boothsStore.creditReceipts -
                    boothsStore.otherReceipts,
                )
              }}
            </span>
          </div>
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
