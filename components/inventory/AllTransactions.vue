<script setup lang="ts">
import UploadOrders from "./UploadOrders.vue";

const loading = ref(true);

loading.value = true;

const ordersStore = useOrdersStore();
const transactionHelpers = useTransactionHelpers();

loading.value = false;

function openNew() {
  transactionHelpers.editTransaction(
    {
      cookies: {},
      status: "pending",
    },
    "new",
  );
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

          <TransactionsDataTable
            :orders="ordersStore.allOrders"
            transaction-types="all"
            :paginated="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>
