<script setup lang="ts">
import { FilterMatchMode } from "@primevue/core/api";
import { useToast } from "primevue/usetoast";
import type { Order, Girl, Cookie } from "@/types/types";

const loading = ref(true);

loading.value = true;

const ordersStore = useOrdersStore();
const girlsStore = useGirlsStore();

loading.value = false;

const toast = useToast();
const dt = ref();
const deleteOrderDialog = ref(false);
const orderToBeDeleted: Ref<Order | null> = ref(null);
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

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
</script>

<template>
  <div class="col-span-12 lg:col-span-12 xl:col-span-12">
    <div class="card">
      <h5>Girl Inventory</h5>
      <p>
        Use this section to track scout restock requests and returns. You can
        also distribute or return cookies without a request.
      </p>

      <Tabs value="0">
        <TabList>
          <Tab value="0" class="flex items-center gap-2"
            ><i class="pi pi-envelope" />Requests (0)</Tab
          >
          <Tab value="1" class="flex items-center gap-2"
            ><i class="pi pi-exclamation-triangle" />Pending (0)</Tab
          >
          <Tab value="2" class="flex items-center gap-2"
            ><i class="pi pi-check" />Completed ({{
              ordersStore.completedOrderListCount
            }})</Tab
          >
          <Tab value="3" class="flex items-center gap-2"
            ><i class="pi pi-times" />Rejected (0)</Tab
          >
        </TabList>
        <TabPanels>
          <TabPanel value="0" />
          <TabPanel value="1" />
          <TabPanel value="3" />
          <TabPanel value="2">
            <div>
              <DataTable
                ref="dt"
                :value="ordersStore.completedOrderList"
                data-key="id"
                :filters="filters"
                sort-field="order_date"
                paginator
                :rows="20"
                :rows-per-page-options="[20, 50, 100]"
                size="small"
              >
                <Column field="to" header="To" sortable>
                  <template #body="slotProps">
                    {{ getGirlName(slotProps.data.to) }}
                  </template>
                </Column>
                <Column field="from" header="From" sortable>
                  <template #body="slotProps">
                    {{
                      getGirlName(slotProps.data.from) ||
                      getGirlName(slotProps.data.from)
                    }}
                  </template>
                </Column>
                <Column field="type" header="Type" sortable>
                  <template #body="slotProps">
                    <Badge
                      :severity="
                        slotProps.data.type == 'distribution'
                          ? 'success'
                          : 'info'
                      "
                    >
                      {{ slotProps.data.type }}
                    </Badge>
                  </template>
                </Column>
                <Column field="cookies" header="Cookies">
                  <template #body="slotProps">
                    <CookieList :cookies="slotProps.data.cookies" />
                  </template>
                </Column>
                <Column field="order_date" header="Requested" sortable />
                <Column field="order_date" header="Completed" sortable />
                <Column header="Notes">...</Column>
              </DataTable>
            </div>
          </TabPanel>
        </TabPanels>

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
      </Tabs>
    </div>
  </div>
</template>
