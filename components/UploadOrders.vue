<script setup lang="ts">

import * as XLSX from "xlsx";
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
    if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        showToast("error", "Error", 'Please upload a valid .xlsx file.');
        return;
    }

    // Validate file size
    if (file.size > 1000000) {
        showToast("error", "Error", "File is too large. Please upload a file under 1MB.");
        return;
    }

    if (!profileStore.currentProfile?.season) return;

    try {
        const sheet = await readExcel(file);

        const jsonData = XLSX.utils.sheet_to_json<SCOrder2025>(sheet);
        const orders = jsonData.map(ordersStore.convertSCOrderToNewOrder).filter((order): order is NewOrder => order !== undefined);
        
        // Save all of the uploaded orders as JSON
        await uploadsStore.insertUpload(jsonData);
        
        // Insert into orders table
        await ordersStore.insertOrders(orders);

        // Clear the file input
        event.files = [];

        ordersStore.fetchOrders();
        
        // Set success message
        showToast("success", "Successful", "File uploaded and data inserted successfully!");
    } catch (error) {
        if (error instanceof Error) {
            showToast("error", "Error", error.message);
        }
    }
};

const readExcel = (file: File): Promise<XLSX.WorkSheet> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' , cellDates: true});

            const sheetName = workbook.SheetNames[0];  // Get the first sheet
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
        :custom-upload=true
        :auto=true
        :max-file-size="1000000" 
        choose-label="Choose File" 
        :upload-label="'Upload File'"
        @select="handleFileUpload"
        />
    </div>
</template>
