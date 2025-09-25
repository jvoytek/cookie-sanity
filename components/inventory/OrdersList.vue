<script setup lang="ts">
import { FilterMatchMode } from "@primevue/core/api";
import { useToast } from "primevue/usetoast";
import type { Order, Girl, Cookie } from "@/types/types";
import UploadOrders from "./UploadOrders.vue";

const loading = ref(true);

loading.value = true;

const ordersStore = useOrdersStore();
const girlsStore = useGirlsStore();
const cookiesStore = useCookiesStore();

loading.value = false;

const toast = useToast();
const dt = ref();
const deleteOrderDialog = ref(false);
const orderToBeDeleted: Ref<Order | null> = ref(null);
const expandedRows = ref({});
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});
const submitted = ref(false);
const originalDataCols = [
  { field: "DATE", header: "DATE" },
  { field: "ORDER #", header: "ORDER #" },
  { field: "TO", header: "TO" },
  { field: "FROM", header: "FROM" },
  { field: "TYPE", header: "TYPE" },
  { field: "STATUS", header: "STATUS" },
  { field: "TOTAL $", header: "TOTAL $" },
];

function openNew() {
  ordersStore.addTemporaryOrder();
}

async function onRowEditSave(event: { newData: Order; data: Order }) {
  submitted.value = true;
  try {
    if (event.newData.id == -1) {
      const { id, created_at, ...insertOrder } = event.newData;
      console.log(insertOrder);
      ordersStore.insertNewOrderFromOrdersList(insertOrder);
    } else {
      ordersStore.upsertOrder(event.newData);
    }
  } catch (error) {
    if (error instanceof Error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: error.message,
        life: 3000,
      });
    }
  }
}

function confirmDeleteOrder(ord: Order) {
  orderToBeDeleted.value = { ...ord };
  deleteOrderDialog.value = true;
}

async function deleteOrder() {
  try {
    if (!orderToBeDeleted.value) return;
    ordersStore.deleteOrder(orderToBeDeleted.value);
    deleteOrderDialog.value = false;
  } catch (error) {
    if (error instanceof Error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: error.message,
        life: 3000,
      });
    }
  }
}

function findIndexById(id: number, theList: Order[] | Girl[] | Cookie[]) {
  let index = -1;
  for (let i = 0; i < theList.length; i++) {
    if (theList[i].id === id) {
      index = i;
      break;
    }
  }
  return index;
}

function getGirlName(id: number) {
  const theGirl = girlsStore.allGirls
    ? girlsStore.allGirls[findIndexById(id, girlsStore.allGirls)]
    : null;
  if (theGirl) {
    return formatGirlName(theGirl);
  }
}

function formatGirlName(theGirl: Girl) {
  return theGirl.first_name + " " + theGirl.last_name[0] + ".";
}

function getCookieTotal(orderCookies: Record<string, number>) {
  let total = 0;
  for (const key in cookiesStore.allCookies) {
    const cookie = cookiesStore.allCookies[key];
    total += orderCookies[cookie.abbreviation] ?? 0;
  }
  return total;
}
</script>

<template>
  <div class="col-span-12 lg:col-span-12 xl:col-span-12">
    <div class="card">
      <h5>Orders</h5>

      <div>
        <div class="card">
          <Toolbar class="mb-6">
            <template #start>
              <Button
                label="New"
                icon="pi pi-plus"
                severity="secondary"
                class="mr-2"
                @click="openNew"
              />
              <UploadOrders />
            </template>
          </Toolbar>

          <DataTable
            ref="dt"
            v-model:editing-rows="ordersStore.editingRows"
            v-model:expanded-rows="expandedRows"
            edit-mode="row"
            :value="ordersStore.allOrders"
            data-key="id"
            :filters="filters"
            sort-field="order_date"
            paginator
            :rows="20"
            :rows-per-page-options="[20, 50, 100]"
            size="small"
            :pt="{
              rowExpansionCell: ({ instance: {} }) => ({
                style: {
                  padding: 0,
                },
              }),
            }"
            @row-edit-save="onRowEditSave"
          >
            <template #header>
              <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Manage Orders</h4>
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

            <Column
              expander
              :pt="{
                rowToggleButton: ({ instance: { rowData } }) => {
                  console.log(rowData?.cookies.DATE);
                  return {
                    style: {
                      display: !rowData?.cookies.DATE ? 'none' : '',
                    },
                  };
                },
              }"
              style="width: 5%"
            />
            <Column
              field="order_date"
              header="Date"
              style="width: 10%"
              sortable
            >
              <template #editor="{ data, field }">
                <DatePicker
                  v-model.trim="data[field]"
                  required="true"
                  date-format="yy-mm-dd"
                  fluid
                />
              </template>
            </Column>
            <Column
              field="order_num"
              header="Order #"
              style="width: 10%"
              sortable
            >
              <template #editor="{ data, field }">
                <InputText v-model="data[field]" fluid />
              </template>
            </Column>
            <Column field="to" header="To" style="width: 10%" sortable>
              <template #body="slotProps">
                {{ getGirlName(slotProps.data.to) }}
              </template>
              <template #editor="{ data, field }">
                <Select
                  v-model="data[field]"
                  :options="girlsStore.allGirls || []"
                  :option-label="formatGirlName"
                  option-value="id"
                  placeholder="Select a Girl"
                  fluid
                />
              </template>
            </Column>
            <Column
              v-for="cookie in cookiesStore.allCookies"
              :key="cookie.id"
              field="cookies"
              :header="cookie.abbreviation"
              style="width: 5%"
            >
              <template #body="slotProps">
                {{ slotProps.data.cookies[cookie.abbreviation] }}
              </template>
              <template #editor="{ data, field }">
                <InputNumber
                  v-model="data[field][cookie.abbreviation]"
                  size="small"
                  fluid
                />
              </template>
            </Column>
            <Column field="cookies-total" header="Total" style="width: 5%">
              <template #body="slotProps">
                {{ getCookieTotal(slotProps.data.cookies) }}
              </template>
            </Column>
            <Column :row-editor="true" />
            <Column nowrap>
              <template #body="slotProps">
                <Button
                  icon="pi pi-trash"
                  outlined
                  rounded
                  severity="danger"
                  @click="confirmDeleteOrder(slotProps.data)"
                />
              </template>
            </Column>
            <template #expansion="slotProps">
              <OriginalDataTable
                :data="slotProps.data.cookies"
                :original-data-cols="originalDataCols"
              />
            </template>
          </DataTable>
        </div>

        <Dialog
          v-model:visible="deleteOrderDialog"
          :style="{ width: '450px' }"
          header="Confirm"
          :modal="true"
        >
          <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            Are you sure you want to delete
            <b>{{ orderToBeDeleted.order_date }}</b
            >?
          </div>
          <template #footer>
            <Button
              label="No"
              icon="pi pi-times"
              text
              @click="deleteOrderDialog = false"
            />
            <Button label="Yes" icon="pi pi-check" @click="deleteOrder" />
          </template>
        </Dialog>
      </div>
    </div>
  </div>
</template>
