<script setup lang="ts">
  import type { BoothSale } from '@/types/types';

  const boothsStore = useBoothsStore();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const notificationHelpers = useNotificationHelpers();
  const { parseFile } = useAuditFileUpload();

  const importDialogVisible = defineModel<boolean>('visible', {
    required: true,
  });
  const loading = ref(false);

  // Constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  const REQUIRED_HEADERS = [
    'SaleDate',
    'StartTime',
    'EndTime',
    'Chain',
    'address1',
  ];

  // Handle file upload event
  const handleFileUpload = async (event: { files: File[] }): Promise<void> => {
    const file = event.files[0];

    // Validate file type
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (fileExtension !== 'csv' && fileExtension !== 'xlsx') {
      notificationHelpers.addError(
        new Error('Invalid file type. Please upload a .csv or .xlsx file.'),
      );
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      notificationHelpers.addError(new Error('File size exceeds 5MB limit.'));
      return;
    }

    if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id) {
      notificationHelpers.addError(new Error('Profile or season not found.'));
      return;
    }

    try {
      loading.value = true;
      const parsedData = await parseFile(file);
      const boothSales = processBoothSales(parsedData.headers, parsedData.rows);

      // Insert booth sales into database
      await insertBoothSales(boothSales);

      // Clear the file input
      event.files = [];

      // Refresh booth sales list
      await boothsStore.fetchBoothSales();

      // Close dialog (success message is shown by insertBatchBoothSales)
      importDialogVisible.value = false;
    } catch (error) {
      if (error instanceof Error) {
        notificationHelpers.addError(error);
      }
    } finally {
      loading.value = false;
    }
  };

  const processBoothSales = (
    headers: string[],
    rows: unknown[][],
  ): Partial<BoothSale>[] => {
    // Validate required headers
    const missingHeaders = REQUIRED_HEADERS.filter(
      (required) => !headers.includes(required),
    );
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Create header index map
    const headerIndexMap: Record<string, number> = {};
    headers.forEach((header, index) => {
      headerIndexMap[header] = index;
    });

    const boothSales: Partial<BoothSale>[] = [];
    const existingBoothSales = new Set(
      boothsStore.allBoothSales.map(
        (bs) =>
          `${convertDateToYYYYMMDD(bs.sale_date)}|${bs.location}|${convertTimeTo24Hour(bs.start_time)}|${convertTimeTo24Hour(bs.end_time)}`,
      ),
    );

    for (const row of rows) {
      try {
        // Extract values from row
        const saleDate = String(row[headerIndexMap['SaleDate']] || '').trim();
        const startTime = String(row[headerIndexMap['StartTime']] || '').trim();
        const endTime = String(row[headerIndexMap['EndTime']] || '').trim();
        const chain = String(row[headerIndexMap['Chain']] || '')
          .trim()
          .replace(/\/$/, ''); // trim white space and remove trailing / if present
        const address1 = String(row[headerIndexMap['address1']] || '').trim();

        // Skip rows without required data
        if (!saleDate || !startTime || !endTime || !chain || !address1) {
          continue;
        }

        // Convert date to yyyy-mm-dd format
        const formattedDate = convertDateToYYYYMMDD(saleDate);
        if (!formattedDate) {
          console.warn(`Invalid date format: ${saleDate}`);
          continue;
        }

        // Format location as "[Chain] ([address1])"
        const location = `${chain} (${address1})`;

        // Convert times to 24-hour format for consistency
        const formattedStartTime = convertTimeTo24Hour(startTime);
        const formattedEndTime = convertTimeTo24Hour(endTime);

        if (!formattedStartTime || !formattedEndTime) {
          console.warn(`Invalid time format: ${startTime} - ${endTime}`);
          continue;
        }

        // Check for duplicates
        const boothKey = `${formattedDate}|${location}|${formattedStartTime}|${formattedEndTime}`;
        if (existingBoothSales.has(boothKey)) {
          console.log(`Skipping duplicate booth sale: ${boothKey}`);
          continue;
        }

        // Add to the set to prevent duplicates within the import
        existingBoothSales.add(boothKey);

        boothSales.push({
          sale_date: formattedDate,
          start_time: formattedStartTime,
          end_time: formattedEndTime,
          location: location,
          inventory_type: 'troop', // Default to troop inventory
          profile: profileStore.currentProfile?.id,
          season: seasonsStore.currentSeason?.id,
          expected_sales: 0,
          predicted_cookies: {},
        });
      } catch (error) {
        console.warn('Error processing row:', error);
        continue;
      }
    }

    return boothSales;
  };

  const convertDateToYYYYMMDD = (dateValue: string): string | null => {
    try {
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

  const convertTimeTo24Hour = (timeValue: string): string | null => {
    try {
      // If already in 24-hour format (HH:MM)
      if (/^\d{1,2}:\d{2}$/.test(timeValue)) {
        const [hours, minutes] = timeValue.split(':');
        return `${hours.padStart(2, '0')}:${minutes}`;
      }

      // If in 12-hour format with AM/PM
      const match = timeValue.match(
        /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM|am|pm)$/i,
      );
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const period = match[3].toUpperCase();

        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }

        return `${String(hours).padStart(2, '0')}:${minutes}`;
      }

      return null;
    } catch {
      return null;
    }
  };

  const insertBoothSales = async (
    boothSales: Partial<BoothSale>[],
  ): Promise<void> => {
    if (boothSales.length === 0) {
      throw new Error(
        'No valid booth sales found in the file (all may be duplicates).',
      );
    }

    // Use batch insert
    await boothsStore.importBoothSales(boothSales);
  };
</script>

<template>
  <Dialog
    v-model:visible="importDialogVisible"
    :style="{ width: '500px' }"
    header="Import Booth Sales"
    :modal="true"
  >
    <div class="flex flex-col gap-4">
      <p class="text-muted-color">
        Upload a SmartCookies booth sales .xlsx or .csv file to automatically
        import booth sales. Duplicate entries will be skipped.
      </p>

      <div
        class="border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-lg p-4"
      >
        <FileUpload
          name="file"
          accept=".xlsx,.csv"
          :custom-upload="true"
          :auto="true"
          :max-file-size="MAX_FILE_SIZE"
          choose-label="Choose File"
          :disabled="loading"
          @select="handleFileUpload"
        />
      </div>

      <div class="text-sm text-muted-color">
        <p class="font-semibold mb-2">Required columns:</p>
        <ul class="list-disc list-inside space-y-1">
          <li>SaleDate - Date of the booth sale</li>
          <li>StartTime - Start time of the booth sale</li>
          <li>EndTime - End time of the booth sale</li>
          <li>Chain - Store/location chain name</li>
          <li>address1 - Street address</li>
        </ul>
        <p class="mt-2 text-xs">
          Other columns (address2, city, state, zipcode) can be present but will
          be ignored.
        </p>
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
