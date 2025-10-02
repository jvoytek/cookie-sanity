<script setup lang="ts">
import * as XLSX from 'xlsx';
import { useToast } from 'primevue/usetoast';
import type { SCOrder2025, NewOrder } from '@/types/types';

const loading = ref(true);

loading.value = true;
const toast = useToast();
const ordersStore = useTransactionsStore();
const uploadsStore = useUploadsStore();
const profileStore = useProfileStore();
const notificationHelpers = useNotificationHelpers();

// Handle file upload event
const handleFileUpload = async (event: { files: File[] }): Promise<void> => {
  const file = event.files[0];

  // Validate file type
  if (
    file.type !==
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    notificationHelpers.addError(new Error('Invalid file type'));
    return;
  }

  // Validate file size
  if (file.size > 1000000) {
    notificationHelpers.addError(new Error('File size exceeds limit'));
    return;
  }

  if (!profileStore.currentProfile?.season) return;

  try {
    const sheet = await readExcel(file);

    const jsonData = XLSX.utils.sheet_to_json<SCOrder2025>(sheet);
    const orders = jsonData
      .map(ordersStore.convertSCOrderToNewTransaction)
      .filter(
        (order) =>
          order !== undefined &&
          typeof order.profile === 'string' &&
          typeof order.order_num === 'string' &&
          typeof order.type === 'string' &&
          typeof order.status === 'string',
      ) as NewOrder[];

    // Save all of the uploaded orders as JSON
    await uploadsStore.insertUpload(jsonData);

    // Insert into orders table
    await ordersStore.insertNewTransactionFromUploads(orders);

    // Clear the file input
    event.files = [];

    ordersStore.fetchTransactions();

    // Set success message
    notificationHelpers.addSuccess(
      'File uploaded and data inserted successfully!',
    );
  } catch (error) {
    if (error instanceof Error) {
      notificationHelpers.addError(error);
    }
  }
};

const readExcel = (file: File): Promise<XLSX.WorkSheet> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });

      const sheetName = workbook.SheetNames[0]; // Get the first sheet
      const sheet = workbook.Sheets[sheetName];

      resolve(sheet);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

const showToast = (severity: string, summary: string, detail: string) => {
  toast.add({
    severity,
    summary,
    detail,
    life: 3000,
  });
};
</script>

<template>
  <div>
    <FileUpload
      name="file"
      accept=".xlsx"
      :custom-upload="true"
      :auto="true"
      :max-file-size="1000000"
      choose-label="Choose File"
      :upload-label="'Upload File'"
      @select="handleFileUpload"
    />
  </div>
</template>
