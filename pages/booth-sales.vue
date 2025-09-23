<script setup lang="ts">
import { FilterMatchMode } from "@primevue/core/api";
import { useToast } from "primevue/usetoast";
import type { BoothSale } from "@/types/types";
import CookieList from "@/components/CookieList.vue";

const loading = ref(true);
loading.value = true;

const boothsStore = useBoothsStore();
const girlsStore = useGirlsStore();
const formatHelpers = useFormatHelpers();
const myForm = ref<FormInstance | null>(null);

loading.value = false;

const toast = useToast();
const dt = ref();
const boothSaleDialog = ref(false);
const deleteBoothSaleDialog = ref(false);
const boothSale = ref<Partial<BoothSale>>({});
const selectedBoothSales = ref();
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const inventoryTypeOptions = [
  { label: "Troop Inventory", value: "troop" },
  { label: "Scout Inventory", value: "scout" },
];

const salesLevelOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

function openNew() {
  editBoothSale({
    scouts_attending: [],
  });
}

function hideDialog() {
  boothSaleDialog.value = false;
}

async function saveBoothSale() {
    if (boothSale.value.id) {
      boothsStore.upsertBoothSale(boothSale.value as BoothSale);
    } else {
      boothsStore.insertBoothSale(boothSale.value as BoothSale);
    }
    boothSaleDialog.value = false;
    boothSale.value = {};
}

function editBoothSale(sale: BoothSale) {
  boothsStore.boothDialogFormSchema.value = getBoothSaleDialogFormSchema();
  boothSale.value = { ...sale };
  boothSaleDialog.value = true;
}

function confirmDeleteBoothSale(sale: BoothSale) {
  boothSale.value = sale;
  deleteBoothSaleDialog.value = true;
}

async function deleteBoothSale() {
  try {
    boothsStore.deleteBoothSale(boothSale.value as BoothSale);
    deleteBoothSaleDialog.value = false;
    boothSale.value = {};
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: (error as Error).message,
      life: 3000,
    });
  }
}

function getSalesLevelSeverity(level: string) {
  switch (level) {
    case "high":
      return "success";
    case "medium":
      return "warn";
    case "low":
      return "secondary";
    default:
      return "secondary";
  }
}

const getBoothSaleDialogFormSchema = () => {
  return [{
    $formkit: "primeDatePicker",
    name: "sale_date",
    label: "Date",
    key: "sale_date",
    placeholder: "Select date",
    validation: "required|date",
    class: "w-full",
    type: "date",
    "date-format": "yy-mm-dd",
    "show-icon": true,
  },  
  {
    $formkit: "primeInputText",
    name: "sale_time",
    label: "Time",
    key: "sale_time",
    placeholder: "Set time",
    validation: "required|time",
    class: "w-full",
    type: "time",
  }, 
  {
    $formkit: "primeInputText",
    name: "location",
    label: "Location",
    key: "location",
    placeholder: "Walmart, Local Grocery Store, etc.",
    validation: "required",
    class: "w-full",
  }, 
  {
    $formkit: "primeMultiSelect",
    name: "scouts_attending",
    options: girlsStore.girlOptions,
     "option-label":"label",
    "option-value": "value",
     placeholder: "Select scouts",
     class: "w-full",
    label: "Scouts Attending",
    key: "scouts_attending",
    showToggleAll: false,
  },

  {
  $formkit: "primeSelect",
    name: "inventory_type",
    label: "Inventory Type",
    key: "inventory_type",
    placeholder: "Choose a type",
    options: inventoryTypeOptions,
    validation: "required",
    class: "w-full",
    "option-label": "label",
    "option-value": "value",
  },
  {
    $formkit: "primeTextarea",
    name: "notes",
    label: "Notes (optional)",
    placeholder: "Notes about this payment",
    class: "w-full",
    rows: 2,
  },
  {    
    $formkit: "primeInputNumber",
    name: "expected_sales",
    label: "Expected Sales",
    key: "expected_sales",
    placeholder: "25, 50, 100, etc.",
    validation: "required|integer|min:0",
    class: "w-full",
  },
  {
    $cmp: "CookieList",
    if: "$predicted_cookies && Object.keys($predicted_cookies).length > 0",
    props: {
      cookies: "$predicted_cookies",
    }
  }

]};

const library = markRaw({
  CookieList: CookieList
})
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
          v-model:selection="selectedBoothSales"
          :value="boothsStore.allBoothSales"
          data-key="id"
          :filters="filters"
          sort-field="sale_date"
        >
          <template #header>
            <div class="flex flex-wrap gap-2 items-center justify-between">
              <h4 class="m-0">Manage Booth Sales</h4>
              <IconField>
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText
                  v-model="filters['global'].value"
                  placeholder="Search..."
                />
              </IconField>
            </div>
          </template>

          <Column field="sale_date" header="Date" sortable>
            <template #body="slotProps">
              {{ formatHelpers.formatDate(slotProps.data.sale_date) }}
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

        <!-- Create/Edit Dialog -->
        <Dialog
          v-model:visible="boothSaleDialog"
          :style="{ width: '550px' }"
          header="Booth Sale Details"
          :modal="true"
        >
          <div class="flex flex-col gap-6">
            <FormKit
              ref="myForm"
              v-model="boothSale"
              type="form"
              :actions="false"
              @submit="saveBoothSale"
            >
              <!-- Render the dynamic form using the schema -->
              <FormKitSchema
                :schema="boothsStore.boothDialogFormSchema.value"
                :library="library"
                :data="boothSale"
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
            <Button label="Save" icon="pi pi-check" @click="myForm.node.submit()" />
          </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog
          v-model:visible="deleteBoothSaleDialog"
          :style="{ width: '450px' }"
          header="Confirm"
          :modal="true"
        >
          <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
            <span v-if="boothSale">
              Are you sure you want to delete the booth sale at
              <b>{{ boothSale.location }}</b> on
              <b>{{ formatHelpers.formatDate(boothSale.sale_date) }}</b
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
