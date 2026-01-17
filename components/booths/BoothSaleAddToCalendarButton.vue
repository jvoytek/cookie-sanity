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

  // Calculate end time and date (add 2 hours to start time as default)
  const calculateEndDateTime = (
    startDate: string,
    startTime: string | null,
  ): { endDate: string; endTime: string } => {
    if (!startTime) {
      return { endDate: startDate, endTime: '11:00' };
    }
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const endHours = hours + 2;

      // Check if event spans into next day
      if (endHours >= 24) {
        const actualEndHours = endHours % 24;
        // Calculate next day
        const date = new Date(startDate);
        date.setDate(date.getDate() + 1);
        const nextDay = date.toISOString().split('T')[0];

        return {
          endDate: nextDay,
          endTime: `${String(actualEndHours).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}`,
        };
      }

      return {
        endDate: startDate,
        endTime: `${String(endHours).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}`,
      };
    } catch {
      return { endDate: startDate, endTime: '11:00' };
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

  const endDateTime = computed(() =>
    calculateEndDateTime(eventStartDate.value, eventStartTime.value),
  );
  const eventEndDate = computed(() => endDateTime.value.endDate);
  const eventEndTime = computed(() => endDateTime.value.endTime);
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
</script>

<template>
  <ClientOnly>
    <add-to-calendar-button
      :name="eventName"
      options="'Apple','Google','iCal','Microsoft365','Outlook.com','Yahoo'"
      :location="eventLocation"
      :startDate="eventStartDate"
      :endDate="eventEndDate"
      :startTime="eventStartTime"
      :endTime="eventEndTime"
      timeZone="currentBrowser"
      debug
      :description="eventDescription"
      size="2"
      lightMode="system"
      hideCheckmark
      hideBackground="true"
      buttonStyle="text"
      trigger="click"
      listStyle="overlay"
    />
  </ClientOnly>
</template>

<style scoped>
  /* Ensure the button integrates well with PrimeVue styles */
  add-to-calendar-button {
    display: inline-block;
  }
</style>
