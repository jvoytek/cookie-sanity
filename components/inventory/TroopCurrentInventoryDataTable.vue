<script setup lang="ts">
  const loading = ref(true);

  loading.value = true;

  const cookiesStore = useCookiesStore();

  loading.value = false;
</script>

<template>
  <div class="card">
    <DataTable
      :value="
        cookiesStore.allCookiesWithInventoryTotals.filter(
          (cookie) => !cookie.is_virtual,
        )
      "
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
    </DataTable>
  </div>
</template>
