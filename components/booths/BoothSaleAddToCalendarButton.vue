<script setup lang="ts">
  import type { BoothSale } from '@/types/types';
  import 'add-to-calendar-button';

  const props = defineProps<{
    boothSale: BoothSale;
  }>();

  // Format the date and time for the calendar button
  const formatDateForCalendar = (dateString: string) => {
    // dateString comes in as MM/DD/YYYY from the store's _transformDataForBoothSale
    // We need to convert it to YYYY-MM-DD for the calendar button
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString;
  };

  const formatTimeForCalendar = (timeString: string | null) => {
    // Time is already in HH:MM format or similar, just ensure it's valid
    if (!timeString) return '09:00'; // Default to 9 AM if no time specified
    return timeString;
  };

  // Calculate end time (add 2 hours to start time as default)
  const calculateEndTime = (startTime: string | null) => {
    if (!startTime) return '11:00';
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const endHours = (hours + 2) % 24; // Add 2 hours, wrap around at midnight
      return `${String(endHours).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}`;
    } catch {
      return '11:00';
    }
  };

  const eventName = computed(
    () => `Cookie Booth Sale - ${props.boothSale.location}`,
  );
  const eventLocation = computed(() => props.boothSale.location);
  const eventStartDate = computed(() =>
    formatDateForCalendar(props.boothSale.sale_date),
  );
  const eventStartTime = computed(() =>
    formatTimeForCalendar(props.boothSale.sale_time),
  );
  const eventEndTime = computed(() =>
    calculateEndTime(props.boothSale.sale_time),
  );
  const eventDescription = computed(() => {
    const parts = ['Cookie Booth Sale'];
    if (props.boothSale.notes) {
      parts.push(`\n\nNotes: ${props.boothSale.notes}`);
    }
    if (props.boothSale.expected_sales) {
      parts.push(
        `\nExpected packages: ${props.boothSale.expected_sales} packages`,
      );
    }
    return parts.join('');
  });

  // Configure calendar options
  const calendarOptions = [
    'Apple',
    'Google',
    'iCal',
    'Microsoft365',
    'Outlook.com',
    'Yahoo',
  ];
</script>

<template>
  <add-to-calendar-button
    :name="eventName"
    :description="eventDescription"
    :startDate="eventStartDate"
    :startTime="eventStartTime"
    :endDate="eventStartDate"
    :endTime="eventEndTime"
    :location="eventLocation"
    :options="calendarOptions"
    timeZone="currentBrowser"
    buttonStyle="round"
    size="2"
    lightMode="system"
    hideCheckmark
    label="+ Add to Calendar"
    trigger="click"
    listStyle="overlay"
  />
</template>

<style scoped>
  /* Ensure the button integrates well with PrimeVue styles */
  add-to-calendar-button {
    display: inline-block;
  }
</style>
