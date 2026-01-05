<script setup lang="ts">
  import type { BoothSale } from '@/types/types';
  import type { Json } from '~/types/supabase';

  const boothsStore = useBoothsStore();
  const girlsStore = useGirlsStore();

  const dt = ref();

  function editBoothSale(sale: BoothSale | null) {
    boothsStore.setActiveBoothSale(sale);
    boothsStore.boothDialogVisible = true;
  }

  function duplicateBoothSale(sale: BoothSale) {
    // Create a copy of the boothsale without database-generated fields
    // This ensures it will be treated as a new transaction when saved
    const { id, created_at, ...saleCopy } = sale;
    saleCopy.status = null;
    editBoothSale({ ...saleCopy });
  }

  function confirmDeleteBoothSale(sale: BoothSale) {
    boothsStore.setActiveBoothSale(sale);
    boothsStore.deleteBoothSaleDialogVisible = true;
  }

  async function unmarkPendingBoothSale(sale: BoothSale) {
    await boothsStore.unmarkPendingBoothSale(sale);
  }

  async function markPendingBoothSale(sale: BoothSale) {
    await boothsStore.markPendingBoothSale(sale);
  }

  async function archiveBoothSale(sale: BoothSale) {
    await boothsStore.archiveBoothSale(sale);
  }

  async function unarchiveBoothSale(sale: BoothSale) {
    await boothsStore.unarchiveBoothSale(sale);
  }

  const cookiesSoldGreaterThanOne = (cookiesSold: Json | null) => {
    if (cookiesSold === null) return false;
    const totalSold = Object.values(cookiesSold).reduce(
      (sum, val) => sum + Number(val || 0),
      0,
    );
    return totalSold > 0;
  };

  const getDerivedStatus = (sale: BoothSale) => {
    if (sale.status === 'archived') {
      return 'archived';
    } else if (cookiesSoldGreaterThanOne(sale.cookies_sold)) {
      return 'recorded';
    } else if (sale.status === 'pending') {
      return 'pending';
    } else {
      return 'upcoming';
    }
  };

  const getStatusToolTip = (status: string | null) => {
    if (status === 'archived') {
      return 'No data from this booth sale will be included in inventory calculations.';
    } else if (status === 'pending') {
      return 'Estimated cookies have been removed from on-hand inventory calculations, but actual sales have not yet been recorded.';
    } else if (status === 'recorded') {
      return 'Actual sales have been recorded for this booth sale, but they have not yet been distributed to girls. Actual sales data will be reflected in inventory calculations.';
    } else {
      return 'Estimated sales will be included in the Upcoming Booths column of Troop Inventory (even if the actual date is in the past).';
    }
  };
</script>

<template>
  <DataTable
    ref="dt"
    :value="boothsStore.visibleBoothSales"
    data-key="id"
    sort-field="sale_date"
  >
    <Column field="sale_date" header="Date" sortable>
      <template #body="slotProps">
        <NuxtTime :datetime="slotProps.data.sale_date" time-zone="UTC" />
      </template>
    </Column>
    <Column field="sale_time" header="Time" sortable>
      <template #body="slotProps">
        {{ slotProps.data.sale_time }}
      </template>
    </Column>
    <Column field="location" header="Location" sortable />
    <Column field="scouts_attending" header="Scouts">
      <template #body="slotProps">
        {{ girlsStore.getGirlNamesByIdList(slotProps.data.scouts_attending) }}
      </template>
    </Column>
    <Column field="inventory_type" header="Inventory Type" sortable>
      <template #body="slotProps">
        <Badge
          :severity="
            slotProps.data.inventory_type === 'troop' ? 'info' : 'secondary'
          "
        >
          {{ slotProps.data.inventory_type }}
        </Badge>
      </template>
    </Column>
    <Column field="expected_sales" header="Estimated Sales" sortable />
    <Column header="Actual Sales" sortable>
      <template #body="slotProps">
        {{ boothsStore.getTotalActualSalesForBoothSale(slotProps.data) }}
      </template>
    </Column>
    <Column field="derived_status" header="Status" sortable>
      <template #body="slotProps">
        <Badge
          :set="derivedStatus = getDerivedStatus(slotProps.data)"
          :severity="
            derivedStatus === 'archived' || derivedStatus === 'recorded'
              ? 'info'
              : derivedStatus === 'pending'
                ? 'warn'
                : 'success'
          "
          v-tooltip.bottom="{
            value: getStatusToolTip(derivedStatus),
          }"
        >
          {{ getDerivedStatus(slotProps.data) }}
        </Badge>
      </template>
    </Column>
    <Column :exportable="false" style="min-width: 12rem" header="Actions">
      <template #body="slotProps">
        <Button
          icon="pi pi-pencil"
          outlined
          class="mr-2"
          v-tooltip.bottom="'Edit Sale'"
          @click="editBoothSale(slotProps.data)"
        />
        <Button
          icon="pi pi-copy"
          outlined
          severity="secondary"
          class="mr-2"
          v-tooltip.bottom="'Duplicate Sale'"
          @click="duplicateBoothSale(slotProps.data)"
        />
        <Button
          icon="pi pi-tag"
          outlined
          severity="secondary"
          class="mr-2"
          v-tooltip.bottom="'Record Sales'"
          @click="boothsStore.openRecordSalesDialog(slotProps.data)"
        />
        <Button
          v-if="
            slotProps.data.status !== 'archived' &&
            slotProps.data.status !== 'pending' &&
            slotProps.data.inventory_type === 'troop'
          "
          icon="pi pi-clock"
          outlined
          severity="secondary"
          class="mr-2"
          v-tooltip.bottom="
            'Mark this sale pending to remove estimated cookie sales from inventory calculations'
          "
          @click="markPendingBoothSale(slotProps.data)"
        />
        <Button
          v-if="slotProps.data.status === 'pending'"
          icon="pi pi-check-circle"
          outlined
          severity="secondary"
          class="mr-2"
          v-tooltip.bottom="'Unmark as Pending'"
          @click="unmarkPendingBoothSale(slotProps.data)"
        />
        <Button
          v-if="slotProps.data.status !== 'archived'"
          icon="pi pi-inbox"
          outlined
          severity="secondary"
          class="mr-2"
          v-tooltip.bottom="
            'Archive Sale. It will no longer appear in troop inventory calculations.'
          "
          @click="archiveBoothSale(slotProps.data)"
        />
        <Button
          v-if="slotProps.data.status == 'archived'"
          icon="pi pi-undo"
          outlined
          severity="secondary"
          class="mr-2"
          v-tooltip.bottom="'Unarchive'"
          @click="unarchiveBoothSale(slotProps.data)"
        />
        <Button
          icon="pi pi-trash"
          outlined
          severity="danger"
          v-tooltip.bottom="'Delete Sale'"
          @click="confirmDeleteBoothSale(slotProps.data)"
        />
      </template>
    </Column>
  </DataTable>
</template>
