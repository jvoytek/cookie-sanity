<script setup lang="ts">
  const boothsStore = useBoothsStore();
  const { formatCurrency } = useFormatHelpers();

  const enterRemainingPackages = ref(true);
  const enterCashBreakdown = ref(true);
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

  // Watch boothsStore.computedTotalCashReceiptsActiveSale to update cashReceiptsActiveSale when not entering breakdown
  watch(
    () => boothsStore.computedTotalCashReceiptsActiveSale,
    (newVal) => {
      boothsStore.cashReceiptsActiveSale =
        boothsStore.computedTotalCashReceiptsActiveSale;
    },
  );

  watch(
    () => boothsStore.cashReceiptsActiveSale,
    (newVal, oldVal) => {
      if (enterCashBreakdown.value === false && newVal !== oldVal) {
        //sync cashbreakdown with ones and cents to equal cashReceiptsActiveSale
        const totalCents = Math.round(newVal * 100);
        const ones = Math.floor(totalCents / 100);
        const cents = (totalCents - ones * 100) / 100; // remainder of cents after removing ones in fractions of a dollar
        boothsStore.cashBreakdownActiveSale = {
          ones: ones,
          fives: 0,
          tens: 0,
          twenties: 0,
          fifties: 0,
          hundreds: 0,
          cents: cents,
        };
      }
    },
  );
</script>
<template>
  <Dialog
    v-model:visible="boothsStore.recordSalesDialogVisible"
    :style="{ width: '500px' }"
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
          >Enter remaining packages to auto-calculate sales</label
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
              ><span
                v-if="slotProps.data.is_virtual"
                class="text-xs italic text-gray-500"
                >(Virtual)</span
              >
            </div>
          </template>
        </Column>
        <Column field="data.predicted" header="Starting Inventory">
          <template #body="slotProps">
            <span v-if="slotProps.data.is_virtual === false">{{
              slotProps.data.data.predicted
            }}</span>
          </template>
        </Column>
        <Column field="data.remaining" header="Remaining">
          <template #body="slotProps">
            <InputNumber
              v-if="
                enterRemainingPackages && slotProps.data.is_virtual === false
              "
              v-model="slotProps.data.data.remaining"
              :min="0"
              :max="slotProps.data.data.predicted"
              @update:model-value="
                (val) =>
                  boothsStore.updateSalesRecordRemaining(
                    slotProps.data.abbreviation,
                    val || 0,
                  )
              "
              input-class="w-16"
            />
            <span v-else-if="slotProps.data.is_virtual === false">{{
              slotProps.data.data.remaining
            }}</span>
          </template>
        </Column>
        <Column field="data.sales" header="Sales">
          <template #body="slotProps">
            <InputNumber
              v-if="
                !enterRemainingPackages || slotProps.data.is_virtual === true
              "
              v-model="slotProps.data.data.sales"
              :min="0"
              :max="slotProps.data.data.predicted"
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
        <h5 class="text-lg font-semibold mb-3">Receipts</h5>
        <div class="flex items-center gap-2 mb-4">
          <ToggleSwitch
            v-model="enterCashBreakdown"
            inputId="cash-breakdown-toggle"
          />
          <label for="cash-breakdown-toggle"
            >Enter cash received by denomination to auto-calculate total</label
          >
        </div>

        <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
          <div class="mb-4" v-if="enterCashBreakdown">
            <div class="grid grid-cols-7 gap-3">
              <div class="flex flex-col">
                <label for="ones" class="text-sm mb-1">$1</label>
                <InputNumber
                  id="ones"
                  v-model="boothsStore.cashBreakdownActiveSale.ones"
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
                  v-model="boothsStore.cashBreakdownActiveSale.fives"
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
                  v-model="boothsStore.cashBreakdownActiveSale.tens"
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
                  v-model="boothsStore.cashBreakdownActiveSale.twenties"
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
                  v-model="boothsStore.cashBreakdownActiveSale.fifties"
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
                  v-model="boothsStore.cashBreakdownActiveSale.hundreds"
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
                  v-model="boothsStore.cashBreakdownActiveSale.cents"
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
          <div class="flex justify-between items-center">
            <span class="font-semibold">Cash Receipts</span>
            <InputNumber
              v-if="!enterCashBreakdown"
              id="cash-receipts"
              v-model="boothsStore.cashReceiptsActiveSale"
              style="width: 100px"
              :min="0"
              :max-fraction-digits="2"
              mode="currency"
              currency="USD"
              locale="en-US"
              input-class="w-full"
              placeholder="0.00"
            />
            <span v-else>
              {{
                formatCurrency(boothsStore.computedTotalCashReceiptsActiveSale)
              }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-semibold">Credit Receipts</span>
            <InputNumber
              id="credit-receipts"
              v-model="boothsStore.creditReceiptsActiveSale"
              style="width: 100px"
              :min="0"
              :max-fraction-digits="2"
              mode="currency"
              currency="USD"
              locale="en-US"
              input-class="w-full"
              placeholder="0.00"
            />
          </div>
          <div class="flex justify-between items-center">
            <span class="font-semibold">Other Receipts</span>
            <InputNumber
              id="other-receipts"
              v-model="boothsStore.otherReceiptsActiveSale"
              style="width: 100px"
              :min="0"
              :max-fraction-digits="2"
              mode="currency"
              currency="USD"
              locale="en-US"
              input-class="w-full"
              placeholder="0.00"
            />
          </div>
          <div
            class="flex justify-between items-center border-t border-gray-300 dark:border-gray-600 mt-2 pt-2"
          >
            <span class="font-semibold">Sales</span>
            <span>
              {{ formatCurrency(totalSales) }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-semibold">Total Receipts</span>
            <span>
              {{
                formatCurrency(
                  boothsStore.cashReceiptsActiveSale +
                    boothsStore.creditReceiptsActiveSale +
                    boothsStore.otherReceiptsActiveSale,
                )
              }}
            </span>
          </div>

          <div class="flex justify-between items-center">
            <span class="font-semibold">Difference</span>
            <span>
              {{
                formatCurrency(
                  totalSales -
                    boothsStore.cashReceiptsActiveSale -
                    boothsStore.creditReceiptsActiveSale -
                    boothsStore.otherReceiptsActiveSale,
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
