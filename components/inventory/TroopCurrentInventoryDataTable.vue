<script setup lang="ts">
  import { useWindowSize } from '@vueuse/core';

  const { width } = useWindowSize();
  const screenWidth = width;

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
  <div>
    <ClientOnly>
      <DataTable
        :value="inventoryTotals"
        data-key="id"
        sort-field="order"
        size="small"
        showGridlines
      >
        <ColumnGroup type="header">
          <Row v-if="screenWidth > 991">
            <Column header="" class="font-bold" />
            <Column header="Troop" :colspan="3" />
            <Column header="Girl" :colspan="2" />
            <Column header="Projection" :colspan="3" />
            <Column header="" :colspan="3" />
          </Row>
          <Row>
            <Column>
              <template #header>
                <strong class="hidden md:block">Cookie Type</strong>
                <strong class="block md:hidden">Type</strong>
              </template>
            </Column>
            <Column>
              <template #header>
                <strong v-if="screenWidth > 991">On Hand</strong>
                <strong v-else>O/H</strong>
              </template>
            </Column>
            <Column header="Pending" v-if="screenWidth > 991" />
            <Column v-if="screenWidth > 991">
              <template #header>
                <strong>Upcoming Booths</strong>
                <i
                  v-tooltip.bottom="{
                    value:
                      'Estimated sales for upcoming booth sales (only from booth sales where In Projections is checked).',
                    showDelay: 500,
                  }"
                  class="pi pi-question-circle"
                />
              </template>
            </Column>
            <Column header="Requested" v-if="screenWidth > 991" />
            <Column header="Pending" v-if="screenWidth > 991" />
            <Column>
              <template #header>
                <strong v-if="screenWidth > 991">After Pending</strong>
                <strong v-else>A/P</strong>
              </template>
            </Column>
            <Column>
              <template #header>
                <strong v-if="screenWidth > 991">Inc. Requests</strong>
                <strong v-else>+REQ</strong>
              </template>
            </Column>
            <Column>
              <template #header>
                <strong v-if="screenWidth > 991">Inc. Booths</strong>
                <strong v-else>+BTH</strong>
              </template>
            </Column>
            <Column header="Total Received" v-if="screenWidth > 991" />
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
              <span class="hidden md:block">{{ slotProps.data.name }}</span>
              <span class="block md:hidden">{{
                slotProps.data.abbreviation
              }}</span>
            </div>
          </template>
        </Column>
        <Column field="onHand" header="On Hand" sortable />
        <Column
          field="pendingTroop"
          header="Pend Troop"
          sortable
          v-if="screenWidth > 991"
        />
        <Column
          field="pendingBooth"
          header="Booth(s) Est"
          sortable
          v-if="screenWidth > 991"
        />
        <Column
          field="requestedGirl"
          header="Req Girl"
          sortable
          v-if="screenWidth > 991"
        />
        <Column
          field="pendingGirl"
          header="Pend Girl"
          sortable
          v-if="screenWidth > 991"
        />
        <Column field="afterPending" header="After Pending" sortable>
          <template #body="slotProps">
            <span
              :class="slotProps.data.afterPending < 0 ? 'text-red-600' : ''"
              >{{ slotProps.data.afterPending }}</span
            >
            <Badge
              v-if="
                slotProps.data.afterPending != 0 &&
                slotProps.data.percent_of_sale &&
                totalAfterPending > 0 &&
                screenWidth > 991
              "
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
              v-if="
                slotProps.data.afterPendingIncludingRequests != 0 &&
                slotProps.data.percent_of_sale &&
                totalAfterPendingIncludingRequests > 0 &&
                screenWidth > 991
              "
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
        <Column
          field="afterPendingIncludingBooths"
          header="Inc. Booths"
          sortable
        >
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
              v-if="
                slotProps.data.afterPendingIncludingBooths != 0 &&
                slotProps.data.percent_of_sale &&
                totalAfterPendingIncludingBooths > 0 &&
                screenWidth > 991
              "
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
        <Column
          field="totalReceivedByTroop"
          header="Total Received"
          sortable
          v-if="screenWidth > 991"
        />

        <ColumnGroup type="footer">
          <Row>
            <Column footer="Total" class="font-bold" />
            <Column :footer="totalOnHand" class="font-bold" />
            <Column
              :footer="totalPendingTroop"
              class="font-bold"
              v-if="screenWidth > 991"
            />
            <Column
              :footer="totalPendingBooth"
              class="font-bold"
              v-if="screenWidth > 991"
            />
            <Column
              :footer="totalRequestedGirl"
              class="font-bold"
              v-if="screenWidth > 991"
            />
            <Column
              :footer="totalPendingGirl"
              class="font-bold"
              v-if="screenWidth > 991"
            />
            <Column :footer="totalAfterPending" class="font-bold" />
            <Column
              :footer="totalAfterPendingIncludingRequests"
              class="font-bold"
            />
            <Column
              :footer="totalAfterPendingIncludingBooths"
              class="font-bold"
            />
            <Column
              :footer="totalReceivedByTroop"
              class="font-bold"
              v-if="screenWidth > 991"
            />
          </Row>
        </ColumnGroup>
      </DataTable>
    </ClientOnly>
  </div>
</template>
