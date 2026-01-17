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
      cash_breakdown,
      credit_receipts,
      cash_receipts,
      other_receipts,
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

  const showDistributeButton = (sale: BoothSale) => {
    return (
      sale.inventory_type === 'troop' &&
      props.type === 'recorded' &&
      cookiesSoldGreaterThanOne(sale.cookies_sold)
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
    <Column field="expected_sales" header="Starting Inventory" sortable />
    <Column
      field="packages_sold"
      header="Packages Sold"
      v-if="props.type === 'recorded' || props.type === 'archived'"
      sortable
    >
      <template #body="slotProps">
        {{ slotProps.data.packages_sold }}
      </template>
    </Column>
    <Column
      field="total_sales"
      header="Sales"
      v-if="props.type === 'recorded' || props.type === 'archived'"
      sortable
    >
      <template #body="slotProps">
        {{ formatCurrency(slotProps.data.total_sales) }}</template
      >
    </Column>
    <Column
      field="cash_receipts"
      header="Cash Receipts"
      v-if="props.type === 'recorded' || props.type === 'archived'"
      sortable
    >
      <template #body="slotProps">
        {{ formatCurrency(slotProps.data.cash_receipts || 0) }}
      </template>
    </Column>
    <Column
      field="credit_receipts"
      header="Credit Receipts"
      v-if="props.type === 'recorded'"
      sortable
    >
      <template #body="slotProps">
        {{ formatCurrency(slotProps.data.credit_receipts || 0) }}
      </template>
    </Column>
    <Column
      field="other_receipts"
      header="Other Receipts"
      v-if="props.type === 'recorded' || props.type === 'archived'"
      sortable
    >
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
              'Starting inventory committed to this sale will not be included in on-hand inventory calculations. This is useful when checking out troop inventory for a booth sale (i.e. removing it from physical troop inventory) but actual sales are not yet known.',
          }"
          class="pi pi-info-circle ml-2 text-sm text-gray-500 cursor-pointer"
        />
      </template>
      <template #body="slotProps">
        {{ slotProps.data.status == 'committed' ? 'yes' : '' }}
      </template>
    </Column>
    <Column :exportable="false" style="min-width: 189px" header="Actions">
      <template #body="slotProps">
        <Button
          icon="pi pi-pencil"
          v-if="props.type !== 'archived'"
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
            'Mark this sale committed to remove starting inventory from inventory calculations. Click this when you have checked out inventory for this booth sale and want to reflect that in inventory calculations, but you have not yet recorded actual sales data.'
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
          v-if="props.type !== 'archived'"
          outlined
          severity="secondary"
          class="mr-2"
          v-tooltip.bottom="'Record Sales'"
          @click="boothsStore.openRecordSalesDialog(slotProps.data)"
        />
        <Button
          v-if="showDistributeButton(slotProps.data)"
          icon="pi pi-sparkles"
          outlined
          severity="secondary"
          class="mr-2"
          v-tooltip.bottom="'Distribute Sales to Girls'"
          @click="boothsStore.openDistributeSalesDialog(slotProps.data)"
        />
        <NuxtLink
          :to="`/booth-sale-print?boothSaleId=${slotProps.data.id}`"
          target="_blank"
          v-if="props.type !== 'recorded' && props.type !== 'archived'"
        >
          <Button
            icon="pi pi-print"
            outlined
            severity="secondary"
            class="mr-2"
            v-tooltip.bottom="'Print Worksheet'"
          />
        </NuxtLink>

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
        <div class="inline-block mr-2" v-if="props.type !== 'archived'">
          <BoothSaleAddToCalendarButton :booth-sale="slotProps.data" />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
