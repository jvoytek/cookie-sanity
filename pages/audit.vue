<script setup lang="ts">
  const auditSessionsStore = useAuditSessionsStore();
</script>

<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12">
      <div class="card">
        <h1 class="text-2xl font-semibold mb-4">Audit Page</h1>
        <p class="text-muted-color mb-4">
          Upload and compare Smart Cookies data exports with Cookie Sanity
          records to identify discrepancies.
        </p>
      </div>
    </div>
    <div class="col-span-12">
      <AuditFileUpload />
    </div>
    <div v-if="auditSessionsStore.mostRecentAuditSession" class="col-span-12">
      <Tabs value="0">
        <TabList>
          <Tab value="0">All Rows</Tab>
          <Tab value="1">Perfect Matches</Tab>
          <Tab value="2">Transactions Missing from Upload</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <AuditRowsDataTable />
          </TabPanel>
          <TabPanel value="1">
            <AuditPerfectMatchesDataTable />
          </TabPanel>
          <TabPanel value="2">
            <TransactionsDataTable
              v-if="auditSessionsStore.unmatchedOrders.length > 0"
              :orders="auditSessionsStore.unmatchedOrders"
              transaction-types="all"
              :paginated="true"
            />
            <div v-else class="text-center py-8">
              <p class="text-muted-color">No unmatched orders found.</p>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
    <div v-else class="col-span-12">
      <AuditRowsDataTable />
    </div>
  </div>
</template>
