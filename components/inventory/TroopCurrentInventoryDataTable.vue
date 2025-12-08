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
          <Column header="After Pending" :colspan="3" />
          <Column header="" :colspan="3" />
        </Row>
        <Row>
          <Column header="Cookie Type" />
          <Column header="On Hand" />
          <Column header="Pending" />
          <Column header="Booth" />
          <Column header="Requested" />
          <Column header="Pending" />
          <Column header="" />
          <Column header="w/Requests" />
          <Column header="Status" />
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
        </template>
      </Column>
      <Column field="afterPendingStatus" header="Status" sortable>
        <template #body="slotProps">
          <Badge :severity="slotProps.data.afterPendingStatusSeverity">
            {{ slotProps.data.afterPendingStatus }}
          </Badge>
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
          <Column footer="" />
          <Column :footer="totalReceivedByTroop" class="font-bold" />
        </Row>
      </ColumnGroup>
    </DataTable>
  </div>
</template>
