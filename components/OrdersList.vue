<script setup lang="ts">

import { FilterMatchMode } from "@primevue/core/api";
import { useToast } from "primevue/usetoast";
import type { Database } from "@/types/supabase";
import type { Order, Girl, Cookie } from "@/types/types";
import UploadOrders from "./UploadOrders.vue";
const supabase = useSupabaseClient<Database>();

const loading = ref(true);

loading.value = true;
const user = useSupabaseUser();


const { $db } = useNuxtApp();
const orders = $db.allOrders;
const girls = $db.allGirls;
const cookies = $db.allCookies;

loading.value = false;

const toast = useToast();
const dt = ref();
const deleteOrderDialog = ref(false);
const emptyOrder = {profile: "", id: -1, created_at: "", order_date: formatDate(new Date()), order_num: "", to: 0, cookies: {}}
const newOrder: Ref<Order> = ref(emptyOrder);
const orderToBeDeleted: Ref<Order> = ref(emptyOrder);
const editingRows: Ref<Order[]> = ref([]);
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});
const submitted = ref(false);

function openNew() {
  newOrder.value = emptyOrder;
  if (orders.value) {
    orders.value.unshift(newOrder.value);
    editingRows.value.push(newOrder.value);
  }
}

async function onRowEditSave(event: { newData: Order; data: Order }) {
  submitted.value = true;

  try {
    event.newData.order_date = formatDate(event.newData.order_date);

    if(!event.newData.profile) {
      event.newData.profile = user.value?.id ?? null;
    }
    if (event.newData.id == -1) {
      const {id, created_at, ...insertOrder} = event.newData;
      console.log(insertOrder);
      const { data, error } = await supabase.from("orders").insert(insertOrder).select().single();
      if (error) throw error;
      if (orders.value) {
        console.log("adding to orders list")
        orders.value.splice(0, 1);
        orders.value.unshift(data);
      }
    } else {
      const { error } = await supabase.from("orders").upsert(event.newData);
      if (error) throw error;
      if (orders.value) {
        console.log("updating orders list")
        orders.value[findIndexById(event.data.id, orders.value)] = event.newData;
      }
    }




    toast.add({
      severity: "success",
      summary: "Successful",
      detail: "Order Updated",
      life: 3000,
    });
  } catch (error){
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
    if(orderToBeDeleted.value === null) {
      return;
    }
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderToBeDeleted.value.id);

    if (error) throw error;

    if (orders.value) {
      orders.value = orders.value.filter(
        (val) => val.id !== orderToBeDeleted.value.id,
      );
    }
    deleteOrderDialog.value = false;
    toast.add({
      severity: "success",
      summary: "Successful",
      detail: "Order Deleted",
      life: 3000,
    });
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
  const theGirl = girls.value ? girls.value[findIndexById(id, girls.value)] : null;
  if (theGirl) {
    return formatGirlName(theGirl);
  }
}

function formatGirlName(theGirl: Girl) {
  return theGirl.first_name + " " + theGirl.last_name[0] + ".";
}

function getCookieTotal(orderCookies: {[id: number]: number}) {
  let total = 0;
  for (const key in cookies.value) {
    total += orderCookies[cookies.value[key].abbreviation] ?? 0;
  }
  return total
}

function formatDate(date: Date | string | null) {
  if (! date || typeof date === 'string') {
    return date
  } else {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
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
            v-model:editing-rows="editingRows"
            edit-mode="row"
            :value="orders"
            data-key="id"
            :filters="filters"
            sort-field="order_date"
            paginator :rows="20" 
            :rows-per-page-options="[20, 50, 100]"
            size="small"
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

            <Column field="order_date" header="Date" sortable> 
              <template #editor="{ data, field }">
                <DatePicker
                  v-model.trim="data[field]"
                  required="true"
                  date-format="yy-mm-dd"
                  fluid
                />
              </template>
            </Column>
            <Column field="order_num" header="Order #" sortable>
              <template #editor="{ data, field }">
                <InputText v-model="data[field]" fluid/>
              </template>
            </Column>
            <Column field="to" header="To" sortable>
              <template #body="slotProps">
                {{ getGirlName(slotProps.data.to) }}
              </template>
              <template #editor="{ data, field }">
                <Select v-model="data[field]" :options="girls || []" :option-label="formatGirlName" option-value="id" placeholder="Select a Girl" fluid />
              </template>
            </Column>
            <Column v-for="cookie in cookies" :key="cookie.abbreviation" field="cookies" :header="cookie.abbreviation">
              <template #body="slotProps">
                {{ slotProps.data.cookies[cookie.abbreviation] }}
              </template>
              <template #editor="{ data, field }">
                <InputNumber v-model="data[field][cookie.abbreviation]" size="small" fluid/>
              </template>
            </Column>
            <Column field="cookies" header="Total">
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
            Are you sure you want to delete <b>{{ orderToBeDeleted.order_date }}</b>?
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
