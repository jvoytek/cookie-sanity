<script setup lang="ts">
  import type { BoothSale } from '@/types/types';
  import type { Json } from '~/types/supabase';

  const props = defineProps<{
    type: 'upcoming' | 'past' | 'recorded' | 'archived';
  }>();

  const boothsStore = useBoothsStore();
  const girlsStore = useGirlsStore();
  const { formatCurrency } = useFormatHelpers();

  const dt = ref();

  function editBoothSale(sale: BoothSale | null) {
    boothsStore.setActiveBoothSale(sale);
    boothsStore.boothDialogVisible = true;
  }

  function duplicateBoothSale(sale: BoothSale) {
    // Create a copy of the boothsale without database-generated fields
    // This ensures it will be treated as a new transaction when saved
    const {
      id,
      created_at,
      scouts_attending,
      cookies_sold,
      status,
      ...saleCopy
    } = sale;
    saleCopy.status = null;
    editBoothSale({ ...saleCopy });
  }

  function confirmDeleteBoothSale(sale: BoothSale) {
    boothsStore.setActiveBoothSale(sale);
    boothsStore.deleteBoothSaleDialogVisible = true;
  }

  async function unmarkCommittedBoothSale(sale: BoothSale) {
    await boothsStore.unmarkCommittedBoothSale(sale);
  }

  async function markCommittedBoothSale(sale: BoothSale) {
    await boothsStore.markCommittedBoothSale(sale);
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

  const moreActions = (sale: BoothSale) => [
    {
      label:
        sale.status !== 'archived'
          ? 'Archive Booth Sale'
          : 'Unarchive Booth Sale',
      icon: sale.status !== 'archived' ? 'pi pi-inbox' : 'pi pi-undo',
      command:
        sale.status !== 'archived'
          ? () => archiveBoothSale(sale)
          : () => unarchiveBoothSale(sale),
    },
    {
      label: 'Duplicate Booth Sale',
      icon: 'pi pi-copy',
      command: () => duplicateBoothSale(sale),
    },
    {
      label: 'Delete Booth Sale',
      icon: 'pi pi-trash',
      command: () => confirmDeleteBoothSale(sale),
    },
  ];

  const menuRefs = ref({});
  const setMenuRef = (el, id) => {
    if (el) menuRefs.value[id] = el;
  };
  // Use in template: :ref="(el) => setMenuRef(el, item.id)"
  const toggleMenu = (event, itemId) => {
    menuRefs.value[itemId].toggle(event);
  };

  const showCommitButton = (sale: BoothSale) => {
    return (
      sale.status !== 'archived' &&
      sale.status !== 'committed' &&
      sale.inventory_type === 'troop' &&
      cookiesSoldGreaterThanOne(sale.cookies_sold) === false
    );
  };

  const showUnCommitButton = (sale: BoothSale) => {
    return (
      sale.status === 'committed' &&
      sale.inventory_type === 'troop' &&
      cookiesSoldGreaterThanOne(sale.cookies_sold) === false
    );
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
    <Column field="cash_receipts" header="Cash Receipts" sortable>
      <template #body="slotProps">
        {{ formatCurrency(slotProps.data.cash_receipts || 0) }}
      </template>
    </Column>
    <Column field="credit_receipts" header="Credit Receipts" sortable>
      <template #body="slotProps">
        {{ formatCurrency(slotProps.data.credit_receipts || 0) }}
      </template>
    </Column>
    <Column field="other_receipts" header="Other Receipts" sortable>
      <template #body="slotProps">
        {{ formatCurrency(slotProps.data.other_receipts || 0) }}
      </template>
    </Column>
    <Column
      field="committed"
      v-if="props.type === 'upcoming' || props.type === 'past'"
      sortable
    >
      <template #header>
        <strong>Committed</strong>
        <i
          v-tooltip.bottom="{
            value:
              'Estimated packages committed to this sale will not be included in on-hand inventory calculations. This is useful when checking out troop inventory for a booth sale (i.e. removing it from physical troop inventory) but actual sales are not yet known.',
          }"
          class="pi pi-info-circle ml-2 text-sm text-gray-500 cursor-pointer"
        />
      </template>
      <template #body="slotProps">
        {{ slotProps.data.status == 'committed' ? 'yes' : '' }}
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
          v-if="showCommitButton(slotProps.data)"
          icon="pi pi-truck"
          outlined
          severity="secondary"
          class="mr-2"
          v-tooltip.bottom="
            'Mark this sale committed to remove estimated cookie sales from inventory calculations'
          "
          @click="markCommittedBoothSale(slotProps.data)"
        />
        <Button
          v-if="showUnCommitButton(slotProps.data)"
          icon="pi pi-undo"
          outlined
          severity="secondary"
          class="mr-2"
          v-tooltip.bottom="'Unmark as Committed'"
          @click="unmarkCommittedBoothSale(slotProps.data)"
        />
        <Button
          icon="pi pi-list-check"
          outlined
          severity="secondary"
          class="mr-2"
          v-tooltip.bottom="'Record Sales'"
          @click="boothsStore.openRecordSalesDialog(slotProps.data)"
        />
        <Button
          type="button"
          icon="pi pi-ellipsis-v"
          outlined
          severity="secondary"
          @click="toggleMenu($event, slotProps.data.id)"
          aria-haspopup="true"
          :aria-controls="'overlay_menu_' + slotProps.data.id"
        />
        <Menu
          :ref="(el) => setMenuRef(el, slotProps.data.id)"
          :id="'overlay_menu_' + slotProps.data.id"
          :model="moreActions(slotProps.data)"
          :popup="true"
        />
      </template>
    </Column>
  </DataTable>
</template>
