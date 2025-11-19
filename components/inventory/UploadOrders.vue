<script setup lang="ts">
  import ExcelJS from 'exceljs';
  import type { SCOrder2025, NewOrder } from '@/types/types';
  import type { Json } from '@/types/supabase';

  const loading = ref(true);

  loading.value = true;
  const ordersStore = useTransactionsStore();
  const uploadsStore = useUploadsStore();
  const profileStore = useProfileStore();
  const cookiesStore = useCookiesStore();
  const notificationHelpers = useNotificationHelpers();

  const _hasPositiveCookieQuantities = (
    cookies: Record<string, number> | undefined,
  ): boolean => {
    if (!cookies) return false;
    // Check if any cookie has a quantity greater than 0
    const hasPositive = cookiesStore.allCookies.some((cookie) => {
      if (cookies[cookie.abbreviation] > 0) {
        return true;
      }
    });
    return hasPositive;
  };

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
      const jsonData = await readExcel(file);

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

      // remove duplicates by order_num for G2G transactions, keep the one with positive quantities if duplicates exist
      // This is because Smart Cookies exports 2 rows per G2G order: one with negative quantities and one with positive quantities, the "TO" field is the same for both orders...yeah...
      const uniqueOrdersMap = new Map<string, NewOrder>();
      const uniqueOrders = [];
      orders.forEach((order) => {
        // If no order number, just add it
        if (!order.order_num) {
          uniqueOrders.push(order);
          return;
        }
        if (order.type !== 'G2G') {
          // For non-G2G orders, just add them
          uniqueOrders.push(order);
          return;
        }
        const existingOrder = uniqueOrdersMap.get(order.order_num);
        if (!existingOrder) {
          uniqueOrdersMap.set(order.order_num, order);
        } else {
          // If duplicate exists, prefer the one with positive quantities
          const existingHasPositiveQuantities = _hasPositiveCookieQuantities(
            existingOrder.cookies,
          );
          const newHasPositiveQuantities = _hasPositiveCookieQuantities(
            order.cookies,
          );
          // If existing has positive quantities, do nothing
          // If new has positive quantities and existing does not, replace
          if (newHasPositiveQuantities && !existingHasPositiveQuantities) {
            uniqueOrdersMap.set(order.order_num, order);
          }
        }
      });

      // add orders with order numbers to uniqueOrders
      uniqueOrders.push(...Array.from(uniqueOrdersMap.values()));

      // Insert into orders table
      await ordersStore.insertNewTransactionFromUploads(uniqueOrders);

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

  const readExcel = (file: File): Promise<SCOrder2025[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data.buffer);
          const worksheet = workbook.worksheets[0]; // Get the first sheet
          if (!worksheet) {
            reject(new Error('No worksheet found in the Excel file'));
            return;
          }
          // Convert worksheet to JSON format similar to XLSX.utils.sheet_to_json
          const jsonData: SCOrder2025[] = [];
          const headerRow = worksheet.getRow(1);
          const headers: string[] = [];
          // Extract headers
          headerRow.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.value?.toString() || '';
          });
          // Process data rows
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              // Skip header row
              const rowData: Record<string, unknown> = {};
              row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                  rowData[header] = cell.value;
                }
              });
              jsonData.push(rowData as SCOrder2025);
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
