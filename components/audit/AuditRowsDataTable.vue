<script setup lang="ts">
  const auditSessionsStore = useAuditSessionsStore();

  // Helper function to validate data structure
  const isValidFileData = (data: unknown): data is { headers?: string[] } => {
    return (
      typeof data === 'object' &&
      data !== null &&
      (!('headers' in data) ||
        (Array.isArray((data as { headers?: unknown }).headers) &&
          (data as { headers?: unknown[] }).headers?.every(
            (h) => typeof h === 'string',
          )))
    );
  };

  // Computed property to extract headers from original_file_data
  const headers = computed(() => {
    const session = auditSessionsStore.mostRecentAuditSession;
    if (!session?.original_file_data) return [];

    if (!isValidFileData(session.original_file_data)) {
      console.warn('Invalid original_file_data structure');
      return [];
    }

    return session.original_file_data.headers || [];
  });

  // Helper function to validate parsed row structure
  const isValidParsedRow = (
    row: unknown,
  ): row is { rowNumber: number; data: unknown[] } => {
    return (
      typeof row === 'object' &&
      row !== null &&
      'rowNumber' in row &&
      typeof (row as { rowNumber: unknown }).rowNumber === 'number' &&
      'data' in row &&
      Array.isArray((row as { data: unknown }).data)
    );
  };

  // Computed property to format parsed_rows for the DataTable
  const formattedRows = computed(() => {
    const session = auditSessionsStore.mostRecentAuditSession;
    if (!session?.parsed_rows) return [];

    const rows = session.parsed_rows;
    if (!Array.isArray(rows)) {
      console.warn('parsed_rows is not an array');
      return [];
    }

    const headersList = headers.value;

    return rows.filter(isValidParsedRow).map((row) => {
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

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Computed property for file metadata
  const fileMetadata = computed(() => {
    const session = auditSessionsStore.mostRecentAuditSession;
    if (!session) return null;

    return {
      fileName: session.file_name,
      fileSize: formatFileSize(session.file_size),
      uploadedAt: new Date(session.created_at).toLocaleString(),
      rowCount: formattedRows.value.length,
    };
  });
</script>

<template>
  <div v-if="auditSessionsStore.mostRecentAuditSession" class="card">
    <div
      v-if="!auditSessionsStore.mostRecentAuditSession"
      class="text-center py-8"
    >
      <p class="text-muted-color">
        No audit data uploaded yet. Upload a file above to see the parsed data
        here.
      </p>
    </div>

    <div
      v-else-if="auditSessionsStore.auditSessionError"
      class="text-center py-8"
    >
      <Message severity="error"
        >There is a problem with the most recent audit upload:
        {{ auditSessionsStore.auditSessionError }}</Message
      >
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
