<script setup lang="ts">
  const auditSessionsStore = useAuditSessionsStore();

  const loading = ref(true);

  // Fetch the most recent audit session on mount
  onMounted(async () => {
    try {
      await auditSessionsStore.fetchMostRecentAuditSession();
    } catch (error) {
      console.error('Error fetching audit session:', error);
    } finally {
      loading.value = false;
    }
  });

  // Computed property to extract headers from original_file_data
  const headers = computed(() => {
    const session = auditSessionsStore.mostRecentAuditSession;
    if (!session?.original_file_data) return [];

    const fileData = session.original_file_data as { headers?: string[] };
    return fileData.headers || [];
  });

  // Computed property to format parsed_rows for the DataTable
  const formattedRows = computed(() => {
    const session = auditSessionsStore.mostRecentAuditSession;
    if (!session?.parsed_rows) return [];

    const rows = session.parsed_rows as Array<{
      rowNumber: number;
      data: unknown[];
    }>;
    const headersList = headers.value;

    return rows.map((row) => {
      const formattedRow: Record<string, unknown> = {
        rowNumber: row.rowNumber,
      };

      // Map each data value to its corresponding header
      if (Array.isArray(row.data)) {
        row.data.forEach((value, index) => {
          const header = headersList[index] || `Column ${index + 1}`;
          formattedRow[header] = value;
        });
      }

      return formattedRow;
    });
  });

  // Computed property for file metadata
  const fileMetadata = computed(() => {
    const session = auditSessionsStore.mostRecentAuditSession;
    if (!session) return null;

    return {
      fileName: session.file_name,
      fileSize: (session.file_size / 1024).toFixed(2) + ' KB',
      uploadedAt: new Date(session.created_at).toLocaleString(),
      rowCount: formattedRows.value.length,
    };
  });
</script>

<template>
  <div class="card">
    <h2 class="text-xl font-semibold mb-4">Recently Uploaded Audit Data</h2>

    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner
        style="width: 50px; height: 50px"
        stroke-width="4"
        animation-duration=".5s"
      />
      <p class="mt-2 text-muted-color">Loading audit data...</p>
    </div>

    <div v-else-if="loadError" class="text-center py-8">
      <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4" />
      <p class="text-muted-color">
        Failed to load audit data. Please try refreshing the page.
      </p>
    </div>

    <div
      v-else-if="!auditSessionsStore.mostRecentAuditSession"
      class="text-center py-8"
    >
      <p class="text-muted-color">
        No audit data uploaded yet. Upload a file above to see the parsed data
        here.
      </p>
    </div>

    <div v-else>
      <!-- File Metadata -->
      <div class="mb-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-muted-color">File Name</p>
            <p class="font-semibold">{{ fileMetadata?.fileName }}</p>
          </div>
          <div>
            <p class="text-sm text-muted-color">File Size</p>
            <p class="font-semibold">{{ fileMetadata?.fileSize }}</p>
          </div>
          <div>
            <p class="text-sm text-muted-color">Uploaded At</p>
            <p class="font-semibold">{{ fileMetadata?.uploadedAt }}</p>
          </div>
          <div>
            <p class="text-sm text-muted-color">Total Rows</p>
            <p class="font-semibold">{{ fileMetadata?.rowCount }}</p>
          </div>
        </div>
      </div>

      <!-- DataTable -->
      <DataTable
        :value="formattedRows"
        paginator
        :rows="10"
        :rows-per-page-options="[10, 25, 50]"
        scrollable
        scroll-height="500px"
        data-key="rowNumber"
        :pt="{
          wrapper: { class: 'overflow-auto' },
        }"
      >
        <Column
          field="rowNumber"
          header="Row #"
          :sortable="true"
          frozen
          style="min-width: 80px"
        />
        <Column
          v-for="header in headers"
          :key="header"
          :field="header"
          :header="header"
          :sortable="true"
          style="min-width: 150px"
        />
      </DataTable>
    </div>
  </div>
</template>
