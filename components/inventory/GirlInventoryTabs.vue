<script setup lang="ts">
  import type { Order, NewOrder } from '@/types/types';

  const loading = ref(true);

  loading.value = true;

  const ordersStore = useTransactionsStore();
  const girlsStore = useGirlsStore();
  const transactionsStore = useTransactionsStore();

  loading.value = false;

  const transactionHelpers = useTransactionHelpers();

  // Filter state - null means show all girls (troop view)
  const selectedGirlFilter = ref<number | null>(null);

  // Computed property for filter options
  const filterOptions = computed(() => {
    const options = [{ label: 'Troop (All Girls)', value: null }];
    const girlOptions = girlsStore.girlOptions.map((option) => ({
      label: option.label,
      value: option.value,
    }));
    return [...options, ...girlOptions];
  });

  // Computed property for subheader text
  const subheaderText = computed(() => {
    if (selectedGirlFilter.value === null) {
      return 'All Girl Transactions';
    }
    const girlName = girlsStore.getGirlNameById(selectedGirlFilter.value);
    return `${girlName}'s Transactions`;
  });

  // Filtered transaction lists based on selected girl
  const filteredRequestedTransactions = computed((): Order[] => {
    return ordersStore.getGirlTransactionsByStatus(
      'requested',
      selectedGirlFilter.value,
    );
  });

  const filteredPendingTransactions = computed((): Order[] => {
    return ordersStore.getGirlTransactionsByStatus(
      'pending',
      selectedGirlFilter.value,
    );
  });

  const filteredCompletedTransactions = computed((): Order[] => {
    return ordersStore.getGirlTransactionsByStatus(
      'complete',
      selectedGirlFilter.value,
    );
  });

  const filteredRecordedTransactions = computed((): Order[] => {
    return ordersStore.getGirlTransactionsByStatus(
      'recorded',
      selectedGirlFilter.value,
    );
  });

  const filteredRejectedTransactions = computed((): Order[] => {
    return ordersStore.getGirlTransactionsByStatus(
      'rejected',
      selectedGirlFilter.value,
    );
  });

  // Computed properties for filtered counts
  const filteredRequestedCount = computed(() => {
    return filteredRequestedTransactions.value.length;
  });

  const filteredPendingCount = computed(() => {
    return filteredPendingTransactions.value.length;
  });

  const filteredCompletedCount = computed(() => {
    return filteredCompletedTransactions.value.length;
  });

  const filteredRecordedCount = computed(() => {
    return filteredRecordedTransactions.value.length;
  });

  const filteredRejectedCount = computed(() => {
    return filteredRejectedTransactions.value.length;
  });

  function openNew() {
    transactionHelpers.editTransaction(
      { status: 'requested' } as NewOrder,
      'girl',
    );
  }
</script>

<template>
  <div class="col-span-12 lg:col-span-12 xl:col-span-12">
    <div class="card">
      <h5>Girl Inventory</h5>
      <p
        class="line-clamp-2"
        @click="$event.currentTarget.classList.toggle('line-clamp-2')"
      >
        Use this section to track scout restock requests and returns. All
        transactions start as Requests. You can then move them to Pending when
        you start processing them, and finally to Completed when the items have
        been given to the scout. Recorded transactions are those that have been
        completed and then recorded in either eBudde or Smart Cookies (depending
        on your council). Rejected transactions are those that were denied for
        any reason.
      </p>
      <div class="hidden lg:block">
        <Toolbar class="mb-6">
          <template #start>
            <Button
              label="New Girl Transaction"
              icon="pi pi-plus"
              severity="secondary"
              class="mr-2"
              @click="openNew"
            />
            <Select
              v-model="selectedGirlFilter"
              :options="filterOptions"
              option-label="label"
              option-value="value"
              placeholder="Filter by girl"
              class="w-64"
            />
          </template>
        </Toolbar>
      </div>
      <div class="lock lg:hidden">
        <Toolbar>
          <template #start>
            <Button
              label="New"
              icon="pi pi-plus"
              severity="secondary"
              class="mr-2"
              @click="openNew"
            />
            <Select
              v-model="selectedGirlFilter"
              :options="filterOptions"
              option-label="label"
              option-value="value"
              placeholder="Filter by girl"
            />
          </template>
        </Toolbar>
      </div>

      <!--<h6 class="mb-4 text-muted-color">{{ subheaderText }}</h6>-->
      <div class="hidden lg:block">
        <Tabs value="0">
          <TabList>
            <Tab value="0" class="flex items-center gap-2"
              ><i class="pi pi-envelope" />Requests ({{
                filteredRequestedCount
              }})</Tab
            >
            <Tab value="1" class="flex items-center gap-2"
              ><i class="pi pi-exclamation-triangle" />Pending ({{
                filteredPendingCount
              }})</Tab
            >
            <Tab value="2" class="flex items-center gap-2"
              ><i class="pi pi-check" />Completed ({{
                filteredCompletedCount
              }})</Tab
            >
            <Tab value="3" class="flex items-center gap-2"
              ><i class="pi pi-check-circle" />Recorded ({{
                filteredRecordedCount
              }})</Tab
            >
            <Tab value="4" class="flex items-center gap-2"
              ><i class="pi pi-times" />Rejected ({{
                filteredRejectedCount
              }})</Tab
            >
          </TabList>
          <TabPanels>
            <TabPanel value="0">
              <TransactionsDataTable
                :orders="filteredRequestedTransactions"
                transaction-types="girl"
                no-transactions-message="No requests found."
              />
            </TabPanel>
            <TabPanel value="1">
              <TransactionsDataTable
                :orders="filteredPendingTransactions"
                transaction-types="girl"
                no-transactions-message="No pending transactions found."
              />
            </TabPanel>
            <TabPanel value="2">
              <TransactionsDataTable
                :orders="filteredCompletedTransactions"
                transaction-types="girl"
                :paginated="true"
                no-transactions-message="No completed transactions found."
              />
            </TabPanel>
            <TabPanel value="3">
              <TransactionsDataTable
                :orders="filteredRecordedTransactions"
                transaction-types="girl"
                :paginated="true"
                no-transactions-message="No recorded transactions found."
              />
            </TabPanel>
            <TabPanel value="4">
              <TransactionsDataTable
                :orders="filteredRejectedTransactions"
                transaction-types="girl"
                no-transactions-message="No rejected transactions found."
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>

    <div class="block lg:hidden">
      <Accordion value="0">
        <AccordionPanel value="0">
          <AccordionHeader>
            <span class="flex items-center gap-2 w-full">
              <i class="pi pi-envelope" />
              <span>Requests</span>
              <Badge
                :value="filteredRequestedCount"
                severity="danger"
                class="ml-auto mr-2"
              />
            </span>
          </AccordionHeader>
          <AccordionContent
            :pt="{ contentWrapper: { class: 'min-w-0 w-full' } }"
          >
            <TransactionsDataTable
              :orders="filteredRequestedTransactions"
              transaction-types="girl"
          /></AccordionContent>
        </AccordionPanel>
        <AccordionPanel value="1">
          <AccordionHeader>
            <span class="flex items-center gap-2 w-full">
              <i class="pi pi-exclamation-triangle" />
              <span>Pending</span>
              <Badge :value="filteredPendingCount" class="ml-auto mr-2" />
            </span>
          </AccordionHeader>
          <AccordionContent
            :pt="{ contentWrapper: { class: 'min-w-0 w-full' } }"
          >
            <TransactionsDataTable
              :orders="filteredPendingTransactions"
              transaction-types="girl"
          /></AccordionContent>
        </AccordionPanel>
        <AccordionPanel value="2">
          <AccordionHeader>
            <span class="flex items-center gap-2 w-full">
              <i class="pi pi-check" />
              <span>Completed</span>
              <Badge :value="filteredCompletedCount" class="ml-auto mr-2" />
            </span>
          </AccordionHeader>
          <AccordionContent
            :pt="{ contentWrapper: { class: 'min-w-0 w-full' } }"
          >
            <TransactionsDataTable
              :orders="filteredCompletedTransactions"
              transaction-types="girl"
            />
          </AccordionContent>
        </AccordionPanel>
        <AccordionPanel value="3">
          <AccordionHeader>
            <span class="flex items-center gap-2 w-full">
              <i class="pi pi-check-circle" />
              <span>Recorded</span>
              <Badge :value="filteredRecordedCount" class="ml-auto mr-2" />
            </span>
          </AccordionHeader>
          <AccordionContent
            :pt="{ contentWrapper: { class: 'min-w-0 w-full' } }"
          >
            <TransactionsDataTable
              :orders="filteredRecordedTransactions"
              transaction-types="girl"
            />
          </AccordionContent>
        </AccordionPanel>
        <AccordionPanel value="4">
          <AccordionHeader>
            <span class="flex items-center gap-2 w-full">
              <i class="pi pi-times" />
              <span>Rejected</span>
              <Badge :value="filteredRejectedCount" class="ml-auto mr-2" />
            </span>
          </AccordionHeader>
          <AccordionContent
            :pt="{ contentWrapper: { class: 'min-w-0 w-full' } }"
          >
            <TransactionsDataTable
              :orders="filteredRejectedTransactions"
              transaction-types="girl"
            />
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </div>
  </div>
</template>
