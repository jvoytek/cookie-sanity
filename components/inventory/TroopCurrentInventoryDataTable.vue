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
    >
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
      <Column field="totalReceivedByTroop" header="Total Received" sortable />
      <Column field="onHand" header="On Hand" sortable />
      <Column field="pendingTroop" header="Pending Troop" sortable />
      <Column field="pendingGirl" header="Pending (Req.)" sortable>
        <template #body="slotProps">
          {{ slotProps.data.pendingGirl }}
          <span v-if="slotProps.data.requestedGirl !== 0">
            ({{ slotProps.data.requestedGirl || 0 }})
          </span>
        </template>
      </Column>
      <Column field="pendingBooth" header="Pending Booth" sortable />

      <Column field="afterPending" header="After Pending" sortable>
        <template #body="slotProps">
          {{ slotProps.data.afterPending }}
          <span
            v-if="
              slotProps.data.afterPendingIncludingRequests !== 0 &&
              slotProps.data.afterPendingIncludingRequests !==
                slotProps.data.afterPending
            "
          >
            ({{ slotProps.data.afterPendingIncludingRequests }})
          </span>
        </template>
      </Column>
      <Column field="afterPendingStatus" header="Status" sortable>
        <template #body="slotProps">
          <Badge :severity="slotProps.data.afterPendingStatusSeverity">
            {{ slotProps.data.afterPendingStatus }}
          </Badge>
        </template>
      </Column>
      <ColumnGroup type="footer">
        <Row>
          <Column footer="Total" class="font-bold" />
          <Column :footer="totalReceivedByTroop" class="font-bold" />
          <Column :footer="totalOnHand" class="font-bold" />
          <Column :footer="totalPendingTroop" class="font-bold" />
          <Column class="font-bold">
            <template #footer>
              {{ totalPendingGirl }}
              <span v-if="totalRequestedGirl !== 0">
                ({{ totalRequestedGirl }})
              </span>
            </template>
          </Column>
          <Column :footer="totalPendingBooth" class="font-bold" />
          <Column class="font-bold">
            <template #footer>
              {{ totalAfterPending }}
              <span
                v-if="
                  totalAfterPendingIncludingRequests !== 0 &&
                  totalAfterPendingIncludingRequests !== totalAfterPending
                "
              >
                ({{ totalAfterPendingIncludingRequests }})
              </span>
            </template>
          </Column>
          <Column footer="" />
        </Row>
      </ColumnGroup>
    </DataTable>
  </div>
</template>
