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

  // Computed property for remaining cookies (cookies sold - total distributed)
  const remainingCookies = computed(() => {
    const remaining: Record<string, number> = {};
    const cookiesSold =
      boothsStore.activeBoothSaleForDistribution?.cookies_sold;

    cookiesStore.allCookies.forEach((cookie) => {
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

  const remainingCookiesTotal = computed(() => {
    return Object.values(remainingCookies.value).reduce(
      (sum, val) => sum + val,
      0,
    );
  });

  // Computed property for total distributed per cookie
  const totalDistributed = computed(() => {
    const totals: Record<string, number> = {};

    cookiesStore.allCookies.forEach((cookie) => {
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
    cookiesStore.allCookies.forEach((cookie) => {
      const quantity =
        boothsStore.distributionData[girl.id]?.[cookie.abbreviation] || 0;
      total += quantity;
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
      <p>
        Distribute the cookies sold at this booth sale to the girls who worked
        it. Adjust quantities as needed.
      </p>

      <DataTable
        :value="assignedGirls"
        size="small"
        :scrollable="true"
        scroll-height="500px"
      >
        <ColumnGroup type="header">
          <Row>
            <Column />
            <Column
              v-for="cookie in cookiesStore.allCookies"
              :key="cookie.abbreviation"
              :header="cookie.abbreviation"
            />
            <Column header="Total" />
          </Row>
          <Row>
            <Column header="Undistributed" />
            <Column
              v-for="cookie in cookiesStore.allCookies"
              :key="cookie.abbreviation"
              ><template #header>
                <span
                  :class="{
                    'text-red-600 dark:text-red-400 font-bold':
                      remainingCookies[cookie.abbreviation] !== 0,
                  }"
                  >{{ remainingCookies[cookie.abbreviation] }}</span
                >
              </template>
            </Column>
            <Column header=""
              ><template #header>
                <span
                  :class="{
                    'text-red-600 dark:text-red-400 font-bold':
                      remainingCookiesTotal !== 0,
                  }"
                  >{{ remainingCookiesTotal }}</span
                >
              </template>
              >
            </Column>
          </Row>
        </ColumnGroup>
        <Column field="name" header="Girl" :frozen="true">
          <template #body="slotProps">
            {{ slotProps.data.first_name }} {{ slotProps.data.last_name }}
          </template>
        </Column>

        <!-- Dynamic columns for each cookie -->
        <Column
          v-for="cookie in cookiesStore.allCookies"
          :key="cookie.abbreviation"
          :field="cookie.abbreviation"
          :header="cookie.abbreviation"
        >
          <template #body="slotProps">
            <InputNumber
              :model-value="
                boothsStore.distributionData[slotProps.data.id]?.[
                  cookie.abbreviation
                ] || 0
              "
              :min="0"
              input-class="w-15"
              @update:model-value="
                (val) =>
                  updateDistribution(
                    slotProps.data.id,
                    cookie.abbreviation,
                    val,
                  )
              "
            />
          </template>
        </Column>

        <!-- Total column -->
        <Column header="Total" :frozen="true" align-frozen="right">
          <template #body="slotProps">
            <strong>{{ getGirlTotal(slotProps.data) }}</strong>
          </template>
        </Column>

        <!-- Footer row for "Total Distributed" -->
        <ColumnGroup type="footer">
          <Row>
            <Column footer="Total Distributed" class="font-semibold" />
            <Column
              v-for="cookie in cookiesStore.allCookies"
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
        :label="
          remainingCookiesTotal > 0
            ? 'Distribute all cookies to save'
            : remainingCookiesTotal < 0
              ? 'Don\'t distribute more than available to save'
              : 'Create new &quot;Troop to Girl (Booth)&quot; transactions and archive this booth sale'
        "
        icon="pi pi-check"
        :disabled="remainingCookiesTotal !== 0"
        @click="boothsStore.saveDistributedSales"
      />
    </template>
  </Dialog>
</template>
