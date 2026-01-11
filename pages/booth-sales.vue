<script setup lang="ts">
  const boothsStore = useBoothsStore();

  function openNew() {
    boothsStore.setActiveBoothSale(null);
    boothsStore.boothDialogVisible = true;
  }
</script>

<template>
  <div class="grid grid-cols-12 gap-8 relative">
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
        <Tabs value="0">
          <TabList>
            <Tab value="0" class="flex items-center gap-2"
              ><i class="pi pi-calendar" />Upcoming Sales ({{
                boothsStore.upcomingBoothSales.length
              }})</Tab
            >
            <Tab value="2" class="flex items-center gap-2"
              ><i class="pi pi-clock" />Past Sales ({{
                boothsStore.pastBoothSales.length
              }})</Tab
            >
            <Tab value="3" class="flex items-center gap-2"
              ><i class="pi pi-list-check" />Recorded Sales ({{
                boothsStore.recordedBoothSales.length
              }})</Tab
            >
            <Tab value="4" class="flex items-center gap-2"
              ><i class="pi pi-inbox" />Archived ({{
                boothsStore.archivedBoothSales.length
              }})</Tab
            >
          </TabList>
          <TabPanels>
            <TabPanel value="0"
              ><BoothsDataTable
                :value="boothsStore.upcomingBoothSales"
                type="upcoming"
            /></TabPanel>
            <TabPanel value="2"
              ><BoothsDataTable :value="boothsStore.pastBoothSales" type="past"
            /></TabPanel>
            <TabPanel value="3"
              ><BoothsDataTable
                :value="boothsStore.recordedBoothSales"
                type="recorded"
            /></TabPanel>
            <TabPanel value="4"
              ><BoothsDataTable
                :value="boothsStore.archivedBoothSales"
                type="archived"
            /></TabPanel>
          </TabPanels>
        </Tabs>

        <BoothSaleDialog />
        <BoothSaleDeleteDialog />
        <BoothSaleRecordDialog />
        <BoothSaleDistributeDialog />
      </div>
    </div>
    <NoCookiesOverlay />
  </div>
</template>
