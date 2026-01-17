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

  // Convert 12-hour format time to 24-hour format
  const convert12to24Hour = (time12: string | null): string => {
    if (!time12) return '09:00'; // Default to 9 AM if no time specified

    const match = time12.match(
      /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM|am|pm)$/i,
    );
    if (!match) return '09:00'; // Default if format is invalid

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  // Calculate end date if event spans midnight
  const calculateEndDate = (
    startDate: string,
    startTime: string,
    endTime: string,
  ): string => {
    const [startHours] = startTime.split(':').map(Number);
    const [endHours] = endTime.split(':').map(Number);

    // If end time is earlier than start time, it spans into the next day
    if (endHours < startHours) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + 1);
      return date.toISOString().split('T')[0];
    }

    return startDate;
  };

  const eventName = computed(
    () => `Cookie Booth Sale - ${props.boothSale.location}`,
  );
  const eventLocation = computed(() => props.boothSale.location);
  const eventStartDate = computed(() =>
    formatDateForCalendar(props.boothSale.sale_date),
  );

  // Convert start and end times from 12-hour to 24-hour format
  const eventStartTime = computed(() =>
    convert12to24Hour(props.boothSale.start_time),
  );
  const eventEndTime = computed(() =>
    convert12to24Hour(props.boothSale.end_time),
  );

  const eventEndDate = computed(() =>
    calculateEndDate(
      eventStartDate.value,
      eventStartTime.value,
      eventEndTime.value,
    ),
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
