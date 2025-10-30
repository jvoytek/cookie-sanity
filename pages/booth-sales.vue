<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import type { BoothSale } from '@/types/types';
import { useFormKitNodeById } from '@formkit/vue';

const formNode = useFormKitNodeById('booth-form');

const loading = ref(true);
loading.value = true;

const boothsStore = useBoothsStore();
const girlsStore = useGirlsStore();
const cookiesStore = useCookiesStore();
const formatHelpers = useFormatHelpers();
const notificationHelpers = useNotificationHelpers();

loading.value = false;

const toast = useToast();
const dt = ref();
const deleteBoothSaleDialog = ref(false);

const inventoryTypeOptions = [
  { label: 'Troop Inventory', value: 'troop' },
  { label: 'Scout Inventory', value: 'scout' },
];

function openNew() {
  editBoothSale(null);
}

function hideDialog() {
  boothsStore.boothDialogVisible = false;
}

async function saveBoothSale() {
  if (boothsStore.activeBoothSale?.id) {
    boothsStore.upsertBoothSale(boothsStore.activeBoothSale);
  } else if (boothsStore.activeBoothSale) {
    boothsStore.insertBoothSale(boothsStore.activeBoothSale);
  }
  boothsStore.boothDialogVisible = false;
  boothsStore.setActiveBoothSale(null);
}

const submitButtonClickHandler = () => {
  if (formNode.value) formNode.value.submit();
};

function editBoothSale(sale: BoothSale) {
  boothsStore.boothDialogFormSchema.value = getBoothSaleDialogFormSchema();
  boothsStore.setActiveBoothSale(sale);
  boothsStore.boothDialogVisible = true;
}

function cancelEditBoothSale() {
  boothsStore.resetActiveBoothSale();
  boothsStore.boothDialogVisible = false;
}

function confirmDeleteBoothSale(sale: BoothSale) {
  boothsStore.setActiveBoothSale(sale);
  deleteBoothSaleDialog.value = true;
}

async function deleteBoothSale() {
  try {
    boothsStore.deleteBoothSale(boothsStore.activeBoothSale);
    deleteBoothSaleDialog.value = false;
    boothsStore.setActiveBoothSale(null);
  } catch (error) {
    notificationHelpers.addError(error as Error);
  }
}

boothsStore.$subscribe((mutation, _state) => {
  const oldSale = mutation.events?.oldValue || {};
  const newSale = mutation.events?.newValue || {};

  const oldExpectedSales = Number(oldSale.expected_sales || 0);
  const newExpectedSales = Number(newSale.expected_sales || 0);

  const newPredictedCookies = newSale.predicted_cookies || {};

  const sumNewPredictedCookies = Object.values(newPredictedCookies).reduce(
    (sum, val) => sum + Number(val || 0),
    0,
  );

  // If nothing relevant changed, skip
  if (
    oldExpectedSales === newExpectedSales &&
    sumNewPredictedCookies === newExpectedSales
  )
    return;

  if (sumNewPredictedCookies !== newExpectedSales) {
    boothsStore.setActiveBoothSaleTotalExpectedSales();
  }
  if (oldExpectedSales !== newExpectedSales) {
    boothsStore.setActiveBoothSalePredictedCookies(newExpectedSales);
  }
});

const getBoothSaleDialogFormSchema = () => {
  return [
    {
      $formkit: 'primeDatePicker',
      name: 'sale_date',
      label: 'Date',
      key: 'sale_date',
      placeholder: 'Select date',
      validation: 'required|date',
      wrapperClass: 'grid grid-cols-4 gap-4 items-center',
      labelClass: 'col-span-1',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
      'date-format': 'mm/dd/yy',
      'show-icon': true,
    },
    {
      $formkit: 'primeInputText',
      name: 'sale_time',
      label: 'Time',
      key: 'sale_time',
      placeholder: 'Set time',
      validation: 'required|time',
      wrapperClass: 'grid grid-cols-4 gap-4 items-center',
      labelClass: 'col-span-1',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeInputText',
      name: 'location',
      label: 'Location',
      key: 'location',
      placeholder: 'Walmart, Local Grocery Store, etc.',
      validation: 'required',
      wrapperClass: 'grid grid-cols-4 gap-4 items-center',
      labelClass: 'col-span-1',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeMultiSelect',
      name: 'scouts_attending',
      options: girlsStore.girlOptions,
      'option-label': 'label',
      'option-value': 'value',
      placeholder: 'Select scouts',
      wrapperClass: 'grid grid-cols-4 gap-4 items-center',
      labelClass: 'col-span-1',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
      label: 'Scouts Attending',
      key: 'scouts_attending',
      showToggleAll: false,
    },

    {
      $formkit: 'primeSelect',
      name: 'inventory_type',
      label: 'Inventory Type',
      key: 'inventory_type',
      placeholder: 'Choose a type',
      options: inventoryTypeOptions,
      validation: 'required',
      wrapperClass: 'grid grid-cols-4 gap-4 items-center',
      labelClass: 'col-span-1',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
      'option-label': 'label',
      'option-value': 'value',
    },
    {
      $formkit: 'primeTextarea',
      name: 'notes',
      label: 'Notes (optional)',
      placeholder: 'Notes about this booth sale',
      class: 'w-full',
      rows: 2,
    },
    {
      $el: 'h6',
      children: 'Predicted Cookie Demand',
    },
    {
      $el: 'p',
      children:
        'Enter total estimated sales to auto-calculate cookie variety demand, or manually enter variety estimates. Setup expected cookie variety percentages in Cookie Settings.',
    },
    {
      $formkit: 'primeToggleSwitch',
      name: 'auto_calculate_predicted_cookies',
      label: 'Auto-Calculate Predicted Cookies',
      key: 'auto_calculate_predicted_cookies',
      id: 'auto_calculate_predicted_cookies',
      value: true,
      wrapperClass: 'grid grid-cols-3 gap-4 items-center',
      labelClass: 'col-span-1',
      innerClass: 'col-span-2 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeInputNumber',
      name: 'expected_sales',
      label: 'Total Estimated Sales',
      key: 'expected_sales',
      placeholder: '25, 50, 100, etc.',
      validation: 'required|integer|min:0',
      wrapperClass: 'grid grid-cols-3 gap-4 items-center',
      labelClass: 'col-span-1',
      innerClass: 'col-span-2 mt-1 mb-1',
      class: 'w-full',
      disabled: "$get('auto_calculate_predicted_cookies').value === false",
    },
    {
      $formkit: 'group',
      name: 'predicted_cookies',
      children: cookiesStore.cookieFormFieldsForBoothSales,
      disabled: "$get('auto_calculate_predicted_cookies').value === true",
    },
  ];
};

const data = {
  validationRules: cookiesStore.customCookieValidationRules, // Add the 'overBooking' function to the validationRules
};
</script>

<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12">
      <div class="card">
        <h5>Booth Sales</h5>
        <p>
          Schedule booth sales and predict cookie demand for inventory planning.
        </p>

        <Toolbar class="mb-6">
          <template #start>
            <Button
              label="New Booth Sale"
              icon="pi pi-plus"
              severity="secondary"
              class="mr-2"
              @click="openNew"
            />
          </template>
        </Toolbar>

        <DataTable
          ref="dt"
          :value="boothsStore.allBoothSales"
          data-key="id"
          sort-field="sale_date"
        >
          <Column field="sale_date" header="Date" sortable>
            <template #body="slotProps">
              <NuxtTime :datetime="slotProps.data.sale_date" timeZone="UTC" />
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
              {{
                girlsStore.getGirlNamesByIdList(slotProps.data.scouts_attending)
              }}
            </template>
          </Column>
          <Column field="inventory_type" header="Inventory Type" sortable>
            <template #body="slotProps">
              <Badge
                :severity="
                  slotProps.data.inventory_type === 'troop'
                    ? 'info'
                    : 'secondary'
                "
              >
                {{ slotProps.data.inventory_type }}
              </Badge>
            </template>
          </Column>
          <Column field="expected_sales" header="Expected Sales" sortable />
          <Column :exportable="false" style="min-width: 12rem">
            <template #body="slotProps">
              <Button
                icon="pi pi-pencil"
                outlined
                rounded
                class="mr-2"
                @click="editBoothSale(slotProps.data)"
              />
              <Button
                icon="pi pi-trash"
                outlined
                rounded
                severity="danger"
                @click="confirmDeleteBoothSale(slotProps.data)"
              />
            </template>
          </Column>
        </DataTable>

        <Dialog
          v-model:visible="boothsStore.boothDialogVisible"
          :style="{ width: '550px' }"
          header="Booth Sale Details"
          :modal="true"
          @after-hide="cancelEditBoothSale"
        >
          <div class="flex flex-col gap-6">
            <FormKit
              id="booth-form"
              v-model="boothsStore.activeBoothSale"
              type="form"
              :actions="false"
              @submit="saveBoothSale"
            >
              <FormKitSchema
                :schema="boothsStore.boothDialogFormSchema.value"
                :data="data"
              />
            </FormKit>
          </div>

          <template #footer>
            <Button
              label="Cancel"
              icon="pi pi-times"
              outlined
              @click="hideDialog"
            />
            <Button
              label="Save"
              icon="pi pi-check"
              @click="submitButtonClickHandler"
            />
          </template>
        </Dialog>

        <Dialog
          v-model:visible="deleteBoothSaleDialog"
          :style="{ width: '450px' }"
          header="Confirm"
          :modal="true"
        >
          <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
            <span v-if="boothsStore.activeBoothSale">
              Are you sure you want to delete the booth sale at
              <b>{{ boothsStore.activeBoothSale.location }}</b> on
              <b
                ><NuxtTime
                  :datetime="boothsStore.activeBoothSale.sale_date" /></b
              >?
            </span>
          </div>
          <template #footer>
            <Button
              label="No"
              icon="pi pi-times"
              outlined
              @click="deleteBoothSaleDialog = false"
            />
            <Button
              label="Yes"
              icon="pi pi-check"
              severity="danger"
              @click="deleteBoothSale"
            />
          </template>
        </Dialog>
      </div>
    </div>
  </div>
</template>
