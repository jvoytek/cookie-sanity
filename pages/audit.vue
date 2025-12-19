<script setup lang="ts">
  const auditSessionsStore = useAuditSessionsStore();
</script>

<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12">
      <div class="card">
        <h1 class="text-2xl font-semibold mb-4">Audit Page</h1>
        <p>
          Upload and compare Smart Cookies data exports with Cookie Sanity
          records to identify discrepancies.
          <strong>Please use with caution.</strong> This feature only works with
          data formatted from Smart Cookies.
        </p>
        <ul class="list-disc list-inside my-4 indent-0.5">
          <li>
            Column headers: DATE, ORDER #, TYPE, FROM, TO, [COOKIES], STATUS,
            TOTAL,TOTAL $,
          </li>
          <li>
            Positive quantities add to the troop supply, negative ones subtract
            from it: Council To Troop (C2T) transactions should have positive
            numbers while Troop To Girl (T2G) transactions should have negative
            ones.
          </li>
        </ul>
        <p>
          To download a .xlsx file from Smart Cookies for comparison, go to
          "Orders : Manage Orders" and click on "All" in the filters bar. Scroll
          to the bottom and click on "Export to Excel"
        </p>
      </div>
    </div>
    <div class="col-span-12">
      <AuditFileUpload />
    </div>
    <div v-if="auditSessionsStore.mostRecentAuditSession" class="col-span-12">
      <Tabs value="0">
        <TabList>
          <Tab value="0"
            >Raw Data ({{
              auditSessionsStore.mostRecentAuditSession.parsed_rows.length
            }})</Tab
          >
          <Tab value="1"
            >Matching Transactions ({{
              auditSessionsStore.perfectMatches.length
            }})</Tab
          >
          <Tab value="2"
            >Partial Matches ({{
              auditSessionsStore.partialMatches.length
            }})</Tab
          >
          <Tab value="4"
            >Extra Rows in Upload ({{
              auditSessionsStore.auditExtraRows.length
            }})</Tab
          >
          <Tab value="3"
            >Transactions Missing from Upload ({{
              auditSessionsStore.unmatchedOrders.length
            }})</Tab
          >
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <AuditRowsDataTable />
          </TabPanel>
          <TabPanel value="1">
            <p>
              These transactions exactly match a row in the uploaded file. If
              they are not marked "recorded" you can do that now.
            </p>
            <AuditPerfectMatchesDataTable />
          </TabPanel>
          <TabPanel value="2">
            <AuditPartialMatchesDataTable />
          </TabPanel>
          <TabPanel value="3">
            <TransactionsDataTable
              v-if="auditSessionsStore.unmatchedOrders.length > 0"
              :orders="auditSessionsStore.unmatchedOrders"
              transaction-types="audit"
              :paginated="true"
            />
            <div v-else class="text-center py-8">
              <p class="text-muted-color">No unmatched orders found.</p>
            </div>
          </TabPanel>
          <TabPanel value="4">
            <p>
              <strong>Please Note:</strong> These may also appear in Partial
              Matches. In Smart Cookies "Girl To Girl" transactions result in 2
              rows per transaction (one transaction for the giver and one for
              the receiver). They have the same order number. Cookie Sanity only
              uses one. If you see Girl To Girl transactions in this tab they
              are likely duplicates.
            </p>
            <TransactionsDataTable
              v-if="auditSessionsStore.auditExtraRows.length > 0"
              :orders="auditSessionsStore.auditExtraRows"
              transaction-types="audit-extra"
              :paginated="true"
            />
            <div v-else class="text-center py-8">
              <p class="text-muted-color">No extra rows found in audit.</p>
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
