<script setup lang="ts">
  const loading = ref(true);

  loading.value = true;

  const cookiesStore = useCookiesStore();

  loading.value = false;

  const inventoryTotals = computed(() => {
    return cookiesStore.allCookiesWithInventoryTotals(true);
  });

  const totalReceivedByTroop = computed(() => {
    return inventoryTotals.value.reduce(
      (sum, item) => sum + (item.totalReceivedByTroop || 0),
      0,
    );
  });

  const totalOnHand = computed(() => {
    return inventoryTotals.value.reduce(
      (sum, item) => sum + (item.onHand || 0),
      0,
    );
  });

  const totalPendingTroop = computed(() => {
    return inventoryTotals.value.reduce(
      (sum, item) => sum + (item.pendingTroop || 0),
      0,
    );
  });

  const totalPendingGirl = computed(() => {
    return inventoryTotals.value.reduce(
      (sum, item) => sum + (item.pendingGirl || 0),
      0,
    );
  });

  const totalRequestedGirl = computed(() => {
    return inventoryTotals.value.reduce(
      (sum, item) => sum + (item.requestedGirl || 0),
      0,
    );
  });

  const totalPendingBooth = computed(() => {
    return inventoryTotals.value.reduce(
      (sum, item) => sum + (item.pendingBooth || 0),
      0,
    );
  });

  const totalAfterPending = computed(() => {
    return inventoryTotals.value.reduce(
      (sum, item) => sum + (item.afterPending || 0),
      0,
    );
  });

  const totalAfterPendingIncludingRequests = computed(() => {
    return inventoryTotals.value.reduce(
      (sum, item) => sum + (item.afterPendingIncludingRequests || 0),
      0,
    );
  });

  const totalAfterPendingIncludingBooths = computed(() => {
    return inventoryTotals.value.reduce(
      (sum, item) => sum + (item.afterPendingIncludingBooths || 0),
      0,
    );
  });
</script>

<template>
  <div class="card">
    <DataTable
      :value="inventoryTotals"
      data-key="id"
      sort-field="order"
      size="small"
      showGridlines
    >
      <ColumnGroup type="header">
        <Row>
          <Column header="" class="font-bold" />
          <Column header="Troop" :colspan="3" />
          <Column header="Girl" :colspan="2" />
          <Column header="Projection" :colspan="3" />
          <Column header="" :colspan="3" />
        </Row>
        <Row>
          <Column header="Cookie Type" />
          <Column header="On Hand" />
          <Column header="Pending" />
          <Column>
            <template #header>
              <strong>Booth</strong>
              <i
                v-tooltip.bottom="{
                  value: 'Estimated sales for upcoming booth sales.',
                  showDelay: 500,
                }"
                class="pi pi-question-circle"
              />
            </template>
          </Column>
          <Column header="Requested" />
          <Column header="Pending" />
          <Column header="After Pending" />
          <Column header="Inc. Requests" />
          <Column header="Inc. Booths" />
          <Column header="Total Received" />
        </Row>
      </ColumnGroup>
      <Column field="name" header="Cookie Type" sortable>
        <template #body="slotProps">
          <div class="flex items-center gap-2">
            <span
              class="w-2 h-2 rounded-full flex-shrink-0"
              :style="{
                backgroundColor: slotProps.data.color || '#888',
              }"
            />
            <span>{{ slotProps.data.name }}</span>
          </div>
        </template>
      </Column>
      <Column field="onHand" header="On Hand" sortable />
      <Column field="pendingTroop" header="Pend Troop" sortable />
      <Column field="pendingBooth" header="Booth(s) Est" sortable />
      <Column field="requestedGirl" header="Req Girl" sortable />
      <Column field="pendingGirl" header="Pend Girl" sortable />
      <Column field="afterPending" header="After Pending" sortable>
        <template #body="slotProps">
          <span
            :class="slotProps.data.afterPending < 0 ? 'text-red-600' : ''"
            >{{ slotProps.data.afterPending }}</span
          >
          <Badge
            v-if="slotProps.data.percent_of_sale"
            :set="
              percentDiff = Math.round(
                (slotProps.data.afterPending / totalAfterPending) * 100 -
                  slotProps.data.percent_of_sale,
              )
            "
            :value="
              percentDiff > 0 ? '+' + percentDiff + '%' : percentDiff + '%'
            "
            :severity="
              -2 > percentDiff || percentDiff > 2 ? 'danger' : 'success'
            "
            class="ml-2"
            v-tooltip.bottom="{
              value:
                percentDiff > 0
                  ? 'The percent of total packages in your on-hand inventory for this variety will be ' +
                    percentDiff +
                    '% more than recommended after pending orders are fulfilled.'
                  : 'The percent of total packages in your on-hand inventory for this variety will be ' +
                    percentDiff +
                    '% less than recommended after pending orders are fulfilled.',
              showDelay: 500,
            }"
          ></Badge>
        </template>
      </Column>
      <Column field="afterPendingIncludingRequests" header="w/Req." sortable>
        <template #body="slotProps">
          <span
            :class="
              slotProps.data.afterPendingIncludingRequests < 0
                ? 'text-red-600'
                : ''
            "
            >{{ slotProps.data.afterPendingIncludingRequests }}</span
          >
          <Badge
            v-if="slotProps.data.percent_of_sale"
            :set="
              percentDiff = Math.round(
                (slotProps.data.afterPendingIncludingRequests /
                  totalAfterPendingIncludingRequests) *
                  100 -
                  slotProps.data.percent_of_sale,
              )
            "
            :value="
              percentDiff > 0 ? '+' + percentDiff + '%' : percentDiff + '%'
            "
            :severity="
              -4 > percentDiff || percentDiff > 4
                ? 'danger'
                : -2 > percentDiff || percentDiff > 2
                  ? 'warn'
                  : 'success'
            "
            class="ml-2"
            v-tooltip.bottom="{
              value:
                percentDiff > 0
                  ? 'The percent of total packages in your on-hand inventory for this variety will be ' +
                    percentDiff +
                    '% more than recommended after pending orders and requests are fulfilled.'
                  : 'The percent of total packages in your on-hand inventory for this variety will be ' +
                    percentDiff +
                    '% less than recommended after pending orders and requests are fulfilled.',
              showDelay: 500,
            }"
          ></Badge>
        </template>
      </Column>
      <Column field="afterPendingIncludingBooths" header="Inc. Booths" sortable>
        <template #body="slotProps">
          <span
            :class="
              slotProps.data.afterPendingIncludingBooths < 0
                ? 'text-red-600'
                : ''
            "
            >{{ slotProps.data.afterPendingIncludingBooths }}</span
          >
          <Badge
            v-if="slotProps.data.percent_of_sale"
            :set="
              percentDiff = Math.round(
                (slotProps.data.afterPendingIncludingBooths /
                  totalAfterPendingIncludingBooths) *
                  100 -
                  slotProps.data.percent_of_sale,
              )
            "
            :value="
              percentDiff > 0 ? '+' + percentDiff + '%' : percentDiff + '%'
            "
            :severity="
              -4 > percentDiff || percentDiff > 4
                ? 'danger'
                : -2 > percentDiff || percentDiff > 2
                  ? 'warn'
                  : 'success'
            "
            class="ml-2"
            v-tooltip.bottom="{
              value:
                percentDiff > 0
                  ? 'The percent of total packages in your on-hand inventory for this variety will be ' +
                    percentDiff +
                    '% more than recommended after pending orders, and estimated booths are fulfilled.'
                  : 'The percent of total packages in your on-hand inventory for this variety will be ' +
                    percentDiff +
                    '% less than recommended after pending orders, and estimated booths are fulfilled.',
              showDelay: 500,
            }"
          ></Badge>
        </template>
      </Column>
      <Column field="totalReceivedByTroop" header="Total Received" sortable />

      <ColumnGroup type="footer">
        <Row>
          <Column footer="Total" class="font-bold" />
          <Column :footer="totalOnHand" class="font-bold" />
          <Column :footer="totalPendingTroop" class="font-bold" />
          <Column :footer="totalPendingBooth" class="font-bold" />
          <Column :footer="totalRequestedGirl" class="font-bold" />
          <Column :footer="totalPendingGirl" class="font-bold" />
          <Column :footer="totalAfterPending" class="font-bold" />
          <Column
            :footer="totalAfterPendingIncludingRequests"
            class="font-bold"
          />
          <Column
            :footer="totalAfterPendingIncludingBooths"
            class="font-bold"
          />
          <Column :footer="totalReceivedByTroop" class="font-bold" />
        </Row>
      </ColumnGroup>
    </DataTable>
  </div>
</template>
