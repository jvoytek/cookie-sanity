<script setup lang="ts">
  const auditSessionsStore = useAuditSessionsStore();
  const notificationHelpers = useNotificationHelpers();
  const { validateFile, parseFile, MAX_ROWS, MAX_FILE_SIZE } =
    useAuditFileUpload();

  const loading = ref(false);

  const handleFileUpload = async (event: { files: File[] }): Promise<void> => {
    const file = event.files[0];

    if (!file) {
      return;
    }

    try {
      loading.value = true;

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        notificationHelpers.addError(new Error(validation.error));
        event.files = [];
        return;
      }

      // Parse file
      const parsedData = await parseFile(file);

      // Save to database
      await auditSessionsStore.insertAuditSession(
        file.name,
        file.size,
        {
          headers: parsedData.headers,
          rows: parsedData.rows,
          rowCount: parsedData.rowCount,
        },
        parsedData.rows.map((row, index) => ({
          rowNumber: index + 1,
          data: row,
        })),
      );

      // Clear the file input
      event.files = [];

      // Show success message
      notificationHelpers.addSuccess(
        `File uploaded successfully! Processed ${parsedData.rowCount} rows.`,
      );
    } catch (error) {
      if (error instanceof Error) {
        notificationHelpers.addError(error);
      }
      event.files = [];
    } finally {
      loading.value = false;
    }
  };
</script>

<template>
  <div class="card">
    <h2 class="text-xl font-semibold mb-4">Upload File for Audit</h2>

    <div class="mb-4">
      <p class="text-muted-color mb-2">
        Upload a CSV or XLSX file to begin the audit process. The file will be
        validated and stored for comparison with existing records.
      </p>

      <div class="text-sm text-muted-color mb-4">
        <p class="font-semibold mb-2">Requirements:</p>
        <ul class="list-disc list-inside space-y-1">
          <li>File format: CSV or XLSX only</li>
          <li>Maximum rows: {{ MAX_ROWS.toLocaleString() }}</li>
          <li>
            Maximum file size:
            {{ (MAX_FILE_SIZE / (1024 * 1024)).toFixed(1) }}MB
          </li>
        </ul>
      </div>
    </div>

    <div
      class="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-lg p-4"
    >
      <FileUpload
        name="file"
        accept=".csv,.xlsx"
        :auto="true"
        :max-file-size="MAX_FILE_SIZE"
        choose-label="Choose File"
        :disabled="loading"
        @select="handleFileUpload"
        mode="basic"
      />
    </div>

    <div v-if="loading" class="mt-4 text-center">
      <ProgressSpinner
        style="width: 50px; height: 50px"
        stroke-width="4"
        animation-duration=".5s"
      />
      <p class="mt-2 text-muted-color">Processing file...</p>
    </div>
  </div>
</template>
