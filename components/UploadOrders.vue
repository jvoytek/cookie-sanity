<script setup lang="ts">
import ExcelJS from "exceljs";
import { useToast } from "primevue/usetoast";
import type { SCOrder2025 } from "@/types/types";

const loading = ref(true);

loading.value = true;
const toast = useToast();
const ordersStore = useOrdersStore();
const uploadsStore = useUploadsStore();
const profileStore = useProfileStore();

// Handle file upload event
const handleFileUpload = async (event: { files: File[] }): Promise<void> => {
  const file = event.files[0];

  // Validate file type
  if (
    file.type !==
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    showToast("error", "Error", "Please upload a valid .xlsx file.");
    return;
  }

  // Validate file size
  if (file.size > 1000000) {
    showToast(
      "error",
      "Error",
      "File is too large. Please upload a file under 1MB.",
    );
    return;
  }

  if (!profileStore.currentProfile?.season) return;

  try {
    const jsonData = await readExcel(file);
    const orders = jsonData
      .map(ordersStore.convertSCOrderToNewOrder)
      .filter((order): order is NewOrder => order !== undefined);

    // Save all of the uploaded orders as JSON
    await uploadsStore.insertUpload(jsonData);

    // Insert into orders table
    await ordersStore.insertOrders(orders);

    // Clear the file input
    event.files = [];

    ordersStore.fetchOrders();

    // Set success message
    showToast(
      "success",
      "Successful",
      "File uploaded and data inserted successfully!",
    );
  } catch (error) {
    if (error instanceof Error) {
      showToast("error", "Error", error.message);
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
          if (rowNumber > 1) { // Skip header row
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
