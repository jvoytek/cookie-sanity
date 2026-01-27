<script setup lang="ts">
  import ExcelJS from 'exceljs';
  import type { Payment, SmartCookiesPayment } from '@/types/types';

  const accountsStore = useAccountsStore();
  const girlsStore = useGirlsStore();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const notificationHelpers = useNotificationHelpers();

  const importDialogVisible = defineModel<boolean>('visible', {
    required: true,
  });
  const loading = ref(false);

  // Constants
  const MAX_FILE_SIZE = 1000000; // 1MB in bytes
  const PAYMENT_METHOD_MAP: Record<string, string> = {
    cash: 'cash',
    check: 'check',
    creditcard: 'digital_cookie',
  };

  // Handle file upload event
  const handleFileUpload = async (event: { files: File[] }): Promise<void> => {
    const file = event.files[0];

    // Validate file type
    if (
      file.type !==
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      notificationHelpers.addError(
        new Error('Invalid file type. Please upload an .xlsx file.'),
      );
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      notificationHelpers.addError(new Error('File size exceeds 1MB limit.'));
      return;
    }

    if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id) {
      notificationHelpers.addError(new Error('Profile or season not found.'));
      return;
    }

    try {
      loading.value = true;
      const jsonData = await readExcel(file);
      const payments = processPayments(jsonData);

      // Insert payments into database
      await insertPayments(payments);

      // Clear the file input
      event.files = [];

      // Refresh payments list
      await accountsStore.fetchPayments();

      // Close dialog (success message is shown by insertBatchPayments)
      importDialogVisible.value = false;
    } catch (error) {
      if (error instanceof Error) {
        notificationHelpers.addError(error);
      }
    } finally {
      loading.value = false;
    }
  };

  const readExcel = (file: File): Promise<SmartCookiesPayment[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data.buffer);
          const worksheet = workbook.worksheets[0];

          if (!worksheet) {
            reject(new Error('No worksheet found in the Excel file'));
            return;
          }

          const jsonData: SmartCookiesPayment[] = [];
          const headerRow = worksheet.getRow(1);
          const headers: string[] = [];

          // Extract headers
          headerRow.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.value?.toString() || '';
          });

          // Process data rows
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              const rowData: Record<string, unknown> = {};
              row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                  rowData[header] = cell.value;
                }
              });
              jsonData.push(rowData as SmartCookiesPayment);
            }
          });

          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const processPayments = (
    jsonData: SmartCookiesPayment[],
  ): Partial<Payment>[] => {
    const payments: Partial<Payment>[] = [];

    for (const row of jsonData) {
      // Skip rows without required data
      if (!row.Girl || !row.Date || !row['Payment Method'] || !row.Amount) {
        continue;
      }

      // Get girl ID by name
      const sellerId = girlsStore.getGirlIdByName(row.Girl);
      if (!sellerId) {
        console.warn(`Girl not found: ${row.Girl}`);
        continue;
      }

      // Convert date to yyyy-mm-dd format
      const paymentDate = convertDateToYYYYMMDD(row.Date);
      if (!paymentDate) {
        console.warn(`Invalid date format: ${row.Date}`);
        continue;
      }

      // Map payment method to type
      const type = mapPaymentMethod(row['Payment Method']);
      if (!type) {
        console.warn(`Unknown payment method: ${row['Payment Method']}`);
        continue;
      }

      // Convert amount to float using helper
      const amount = parseAmount(row.Amount);
      if (amount === null) {
        console.warn(`Invalid amount: ${row.Amount}`);
        continue;
      }

      const newPayment = {
        seller_id: sellerId,
        payment_date: paymentDate,
        type: type,
        amount: amount,
        notes: row['Ref #'] ? String(row['Ref #']) : null,
        profile: profileStore.currentProfile?.id,
        season: seasonsStore.currentSeason?.id,
      };

      // determine whether the payment is a duplicate
      const duplicate = accountsStore.checkDuplicatePayment(newPayment);
      if (duplicate === false) {
        payments.push(newPayment);
      }
    }

    return payments;
  };

  const convertDateToYYYYMMDD = (dateValue: string): string | null => {
    try {
      // Handle various date formats
      // If it's already in yyyy-mm-dd format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }

      // If it's in mm/dd/yyyy format
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateValue)) {
        const [month, day, year] = dateValue.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      // Try parsing as a general date
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return null;
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return null;
    }
  };

  const mapPaymentMethod = (method: string): string => {
    const methodLower = method.toLowerCase().trim();
    return PAYMENT_METHOD_MAP[methodLower] || 'other';
  };

  const parseAmount = (value: number | string): number | null => {
    try {
      let amount: number;
      if (typeof value === 'string') {
        // Remove currency symbols, commas, and other non-numeric characters except decimal point and minus sign
        const cleaned = value.replace(/[^0-9.-]/g, '');
        amount = parseFloat(cleaned);
      } else {
        amount = value;
      }
      return isNaN(amount) ? null : amount;
    } catch {
      return null;
    }
  };

  const insertPayments = async (
    payments: Partial<Payment>[],
  ): Promise<void> => {
    if (payments.length === 0) {
      throw new Error('No valid payments found in the file or all duplicates.');
    }

    // Use batch insert instead of inserting one by one
    await accountsStore.insertBatchPayments(payments);
  };
</script>

<template>
  <Dialog
    v-model:visible="importDialogVisible"
    :style="{ width: '500px' }"
    header="Import Financial Transactions"
    :modal="true"
  >
    <div class="flex flex-col gap-4">
      <p class="text-muted-color">
        Upload a SmartCookies financial transactions .xlsx file to import
        payment records.
      </p>

      <div
        class="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-lg p-4"
      >
        <FileUpload
          name="file"
          accept=".xlsx"
          :custom-upload="true"
          :auto="true"
          :max-file-size="MAX_FILE_SIZE"
          choose-label="Choose File"
          :disabled="loading"
          @select="handleFileUpload"
        />
      </div>

      <div class="text-sm text-muted-color">
        <p class="font-semibold mb-2">Expected columns:</p>
        <ul class="list-disc list-inside space-y-1">
          <li>Girl - Name of the scout</li>
          <li>Date - Payment date</li>
          <li>Payment Method - Cash, Check, or Credit Card</li>
          <li>Amount - Payment amount</li>
          <li>Ref # - Reference number (optional)</li>
        </ul>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        text
        :disabled="loading"
        @click="importDialogVisible = false"
      />
    </template>
  </Dialog>
</template>
