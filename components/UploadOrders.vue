<script setup lang="ts">

import * as XLSX from "xlsx";
import { useToast } from "primevue/usetoast";
import type { Database } from "@/types/supabase";
import type { SCOrder2025, Upload } from "@/types/types";


const supabase = useSupabaseClient<Database>();

const loading = ref(true);

loading.value = true;
const user = useSupabaseUser();
const toast = useToast();
const { $db } = useNuxtApp();
const girls = $db.allGirls;

// Handle file upload event
const handleFileUpload = async (event: any): Promise<void> => {
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

    try {
        // Step 1: Read the Excel file
        const sheet = await readExcel(file);

        // Log the sheet object to see what it contains
        console.log('Sheet:', sheet);

        // Ensure that the data looks correct
        const jsonData = XLSX.utils.sheet_to_json<SCOrder2025>(sheet);
        console.log('Parsed JSON Data:', jsonData);

        // Step 3: Insert the JSON data into Supabase
        await insertDataIntoSupabase(jsonData);

        // Convert the uploaded data to Orders
        const girlData = (jsonData as SCOrder2025[]).filter((order) => order['TO'].indexOf && order['TO'].indexOf(' ') >= 0)
        const ordersList: object[] = girlData.map(convertSCOrderToOrder).filter((order) => order.to !== 0);
        console.log(ordersList);
        const { data, error } = await supabase.from("orders").insert(ordersList).select();
        if (error) throw error;

        // Step 4: Clear the file input
        event.files = [];

        // Set success message
        showToast("success", "Successful", "File uploaded and data inserted successfully!");
    } catch (error) {
        if (error instanceof Error) {
            showToast("error", "Error", error.message);
        }
    }
};

const readExcel = (file: File): Promise<any> => {
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

// Insert data into Supabase table
const insertDataIntoSupabase = async (jsonData: SCOrder2025[]): Promise<Upload> => {
    const upload = {
        profile: user?.value?.id,
        data: jsonData,
    };
    const { data, error } = await supabase.from("uploads").insert(upload).select().single();

    if (error) throw new Error(error.message); // Handle any errors from Supabase
    return data;
};

const showToast = (severity: string, summary: string, detail: string) => {
    toast.add({
        severity,
        summary,
        detail,
        life: 3000,
    });
};

function getGirlId(name: string): number {
    const first_name = name.split(" ")[0];
    const last_name = name.split(" ")[1];
    const matchingGirls = girls?.value ? girls.value.filter((girl) => girl.first_name === first_name && girl.last_name === last_name) : [];
    if (matchingGirls.length === 1) {
        return matchingGirls[0].id;
    } else {
        console.log(`Could not
        find  ${name}`);
        return 0;
    }
}

function formatDate(date: Date | string | null) {
    if (! date || typeof date === 'string') {
        return date
    } else {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

function convertSCOrderToOrder(obj: SCOrder2025): object {
    return {
        profile: user?.value?.id,
        order_date: obj.DATE,
        order_num: obj["ORDER #"].toString(),
        to: getGirlId(obj.TO),
        cookies: obj,
    };
}

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
