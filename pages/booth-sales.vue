<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12">
      <div class="card">
        <h5>Booth Sales</h5>
        <p>Schedule booth sales and predict cookie demand for inventory planning.</p>

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
              {{ formatHelpers.formatTime(slotProps.data.sale_time) }}
            </template>
          </Column>
          <Column field="location" header="Location" sortable />
          <Column field="scouts_attending" header="Scouts" sortable>
            <template #body="slotProps">
              {{ slotProps.data.scouts_attending.length }} scout(s)
            </template>
          </Column>
          <Column field="inventory_type" header="Inventory Type" sortable>
            <template #body="slotProps">
              <Badge 
                :severity="slotProps.data.inventory_type === 'troop' ? 'info' : 'secondary'"
              >
                {{ slotProps.data.inventory_type }}
              </Badge>
            </template>
          </Column>
          <Column field="expected_sales_level" header="Expected Sales" sortable>
            <template #body="slotProps">
              <Badge 
                :severity="getSalesLevelSeverity(slotProps.data.expected_sales_level)"
              >
                {{ slotProps.data.expected_sales_level }}
              </Badge>
            </template>
          </Column>
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
            <div>
              <label for="sale_date" class="block text-900 font-medium mb-2">Date</label>
              <DatePicker
                id="sale_date"
                v-model="boothSale.sale_date"
                date-format="yy-mm-dd"
                placeholder="Select date"
                class="w-full"
                :class="{ 'p-invalid': submitted && !boothSale.sale_date }"
                required
              />
              <small v-if="submitted && !boothSale.sale_date" class="text-red-500">
                Date is required.
              </small>
            </div>

            <div>
              <label for="sale_time" class="block text-900 font-medium mb-2">Time</label>
              <InputText
                id="sale_time"
                v-model="boothSale.sale_time"
                placeholder="e.g., 10:00"
                class="w-full"
                :class="{ 'p-invalid': submitted && !boothSale.sale_time }"
                required
              />
              <small v-if="submitted && !boothSale.sale_time" class="text-red-500">
                Time is required.
              </small>
            </div>

            <div>
              <label for="location" class="block text-900 font-medium mb-2">Location</label>
              <InputText
                id="location"
                v-model="boothSale.location"
                placeholder="e.g., Local grocery store"
                class="w-full"
                :class="{ 'p-invalid': submitted && !boothSale.location }"
                required
              />
              <small v-if="submitted && !boothSale.location" class="text-red-500">
                Location is required.
              </small>
            </div>

            <div>
              <label for="scouts_attending" class="block text-900 font-medium mb-2">Scouts Attending</label>
              <MultiSelect
                id="scouts_attending"
                v-model="boothSale.scouts_attending"
                :options="girlsStore.girlOptions"
                option-label="label"
                option-value="label"
                placeholder="Select scouts"
                class="w-full"
                :max-selected-labels="3"
              />
            </div>

            <div>
              <label for="inventory_type" class="block text-900 font-medium mb-2">Inventory Type</label>
              <Select
                id="inventory_type"
                v-model="boothSale.inventory_type"
                :options="inventoryTypeOptions"
                placeholder="Select inventory type"
                class="w-full"
                :class="{ 'p-invalid': submitted && !boothSale.inventory_type }"
                required
              />
              <small v-if="submitted && !boothSale.inventory_type" class="text-red-500">
                Inventory type is required.
              </small>
            </div>

            <div>
              <label for="expected_sales_level" class="block text-900 font-medium mb-2">Expected Sales Level</label>
              <Select
                id="expected_sales_level"
                v-model="boothSale.expected_sales_level"
                :options="salesLevelOptions"
                placeholder="Select expected sales"
                class="w-full"
                :class="{ 'p-invalid': submitted && !boothSale.expected_sales_level }"
                required
              />
              <small v-if="submitted && !boothSale.expected_sales_level" class="text-red-500">
                Expected sales level is required.
              </small>
            </div>

            <div>
              <label for="notes" class="block text-900 font-medium mb-2">Notes</label>
              <Textarea
                id="notes"
                v-model="boothSale.notes"
                placeholder="Additional notes..."
                class="w-full"
                rows="3"
              />
            </div>
          </div>

          <template #footer>
            <Button label="Cancel" icon="pi pi-times" outlined @click="hideDialog" />
            <Button label="Save" icon="pi pi-check" @click="saveBoothSale" />
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
              Are you sure you want to delete the booth sale at <b>{{ boothSale.location }}</b> on 
              <b>{{ formatHelpers.formatDate(boothSale.sale_date) }}</b>?
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

<script setup lang="ts">
import { FilterMatchMode } from "@primevue/core/api";
import { useToast } from "primevue/usetoast";
import type { BoothSale } from "@/types/types";

const loading = ref(true);
loading.value = true;

const boothsStore = useBoothsStore();
const girlsStore = useGirlsStore();
const formatHelpers = useFormatHelpers();

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
const submitted = ref(false);

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
  boothSale.value = {
    scouts_attending: [],
  };
  submitted.value = false;
  boothSaleDialog.value = true;
}

function hideDialog() {
  boothSaleDialog.value = false;
  submitted.value = false;
}

async function saveBoothSale() {
  submitted.value = true;

  if (boothSale?.value.location?.trim() && 
      boothSale?.value.sale_date && 
      boothSale?.value.sale_time &&
      boothSale?.value.inventory_type &&
      boothSale?.value.expected_sales_level) {
    if (boothSale.value.id) {
      boothsStore.upsertBoothSale(boothSale.value as BoothSale);
    } else {
      boothsStore.insertBoothSale(boothSale.value as BoothSale);
    }
    boothSaleDialog.value = false;
    boothSale.value = {};
  }
}

function editBoothSale(sale: BoothSale) {
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
</script>