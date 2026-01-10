<script setup lang="ts">
  import type { Girl } from '@/types/types';

  const boothsStore = useBoothsStore();
  const girlsStore = useGirlsStore();
  const cookiesStore = useCookiesStore();
  const { formatCurrency } = useFormatHelpers();

  // Get girls assigned to the active booth sale
  const assignedGirls = computed<Girl[]>(() => {
    if (!boothsStore.activeBoothSaleForDistribution) return [];
    const scoutsAttending =
      boothsStore.activeBoothSaleForDistribution.scouts_attending;
    if (!scoutsAttending || !Array.isArray(scoutsAttending)) return [];

    return scoutsAttending
      .map((girlId) => girlsStore.getGirlById(girlId))
      .filter((girl): girl is Girl => girl !== null);
  });

  // Get non-virtual cookies
  const nonVirtualCookies = computed(() => {
    return cookiesStore.allCookies.filter((cookie) => !cookie.is_virtual);
  });

  // Computed property for remaining cookies (cookies sold - total distributed)
  const remainingCookies = computed(() => {
    const remaining: Record<string, number> = {};
    const cookiesSold =
      boothsStore.activeBoothSaleForDistribution?.cookies_sold;

    nonVirtualCookies.value.forEach((cookie) => {
      const sold = cookiesSold
        ? (cookiesSold[cookie.abbreviation] as number) || 0
        : 0;
      const distributed = assignedGirls.value.reduce((sum, girl) => {
        return (
          sum +
          (boothsStore.distributionData[girl.id]?.[cookie.abbreviation] || 0)
        );
      }, 0);
      remaining[cookie.abbreviation] = sold - distributed;
    });

    return remaining;
  });

  // Computed property for total distributed per cookie
  const totalDistributed = computed(() => {
    const totals: Record<string, number> = {};

    nonVirtualCookies.value.forEach((cookie) => {
      totals[cookie.abbreviation] = assignedGirls.value.reduce((sum, girl) => {
        return (
          sum +
          (boothsStore.distributionData[girl.id]?.[cookie.abbreviation] || 0)
        );
      }, 0);
    });

    return totals;
  });

  // Get row total for a girl
  const getGirlTotal = (girl: Girl) => {
    let total = 0;
    nonVirtualCookies.value.forEach((cookie) => {
      const quantity =
        boothsStore.distributionData[girl.id]?.[cookie.abbreviation] || 0;
      total += quantity * cookie.price;
    });
    return total;
  };

  const updateDistribution = (
    girlId: number,
    cookieAbbr: string,
    value: number | null,
  ) => {
    boothsStore.updateDistributionData(girlId, cookieAbbr, value || 0);
  };
</script>

<template>
  <Dialog
    v-model:visible="boothsStore.distributeSalesDialogVisible"
    :style="{ width: '90vw', maxWidth: '1200px' }"
    header="Distribute Sales to Girls"
    :modal="true"
    @after-hide="boothsStore.closeDistributeSalesDialog"
  >
    <div class="flex flex-col gap-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Distribute the cookies sold at this booth sale to the girls who worked
        it. Adjust quantities as needed.
      </p>

      <DataTable
        :value="assignedGirls"
        size="small"
        :scrollable="true"
        scroll-height="500px"
      >
        <Column field="name" header="Girl" :frozen="true" style="min-width: 150px">
          <template #body="slotProps">
            {{ slotProps.data.first_name }} {{ slotProps.data.last_name }}
          </template>
        </Column>

        <!-- Dynamic columns for each cookie -->
        <Column
          v-for="cookie in nonVirtualCookies"
          :key="cookie.abbreviation"
          :field="cookie.abbreviation"
          :header="cookie.abbreviation"
          style="min-width: 100px"
        >
          <template #body="slotProps">
            <InputNumber
              :model-value="
                boothsStore.distributionData[slotProps.data.id]?.[
                  cookie.abbreviation
                ] || 0
              "
              :min="0"
              input-class="w-20"
              @update:model-value="
                (val) =>
                  updateDistribution(slotProps.data.id, cookie.abbreviation, val)
              "
            />
          </template>
        </Column>

        <!-- Total column -->
        <Column
          header="Total"
          :frozen="true"
          align-frozen="right"
          style="min-width: 120px"
        >
          <template #body="slotProps">
            <strong>{{ formatCurrency(getGirlTotal(slotProps.data)) }}</strong>
          </template>
        </Column>

        <!-- Header row for "Remaining" -->
        <template #header>
          <tr>
            <th>Girl</th>
            <th v-for="cookie in nonVirtualCookies" :key="cookie.abbreviation">
              {{ cookie.abbreviation }}
            </th>
            <th>Total</th>
          </tr>
          <tr class="bg-yellow-50 dark:bg-yellow-900/20">
            <td class="font-semibold">Remaining</td>
            <td
              v-for="cookie in nonVirtualCookies"
              :key="`remaining-${cookie.abbreviation}`"
              class="text-center"
              :class="{
                'text-red-600 dark:text-red-400 font-bold':
                  remainingCookies[cookie.abbreviation] !== 0,
              }"
            />
              {{ remainingCookies[cookie.abbreviation] }}
            </td>
            <td></td>
          </tr>
        </template>

        <!-- Footer row for "Total Distributed" -->
        <ColumnGroup type="footer">
          <Row>
            <Column footer="Total Distributed" class="font-semibold" />
            <Column
              v-for="cookie in nonVirtualCookies"
              :key="`footer-${cookie.abbreviation}`"
              :footer="totalDistributed[cookie.abbreviation]"
            />
            <Column :footer="''" />
          </Row>
        </ColumnGroup>
      </DataTable>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        outlined
        @click="boothsStore.closeDistributeSalesDialog"
      />
      <Button
        label="Save"
        icon="pi pi-check"
        @click="boothsStore.saveDistributedSales"
      />
    </template>
  </Dialog>
</template>
