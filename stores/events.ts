import type { Database } from '@/types/supabase';
import type { Event } from '@/types/types';

export const useEventsStore = defineStore('events', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const profileStore = useProfileStore();
  const formsStore = useFormsStore();
  const seasonsStore = useSeasonsStore();
  const notificationHelpers = useNotificationHelpers();
  const formatHelpers = useFormatHelpers();

  const allEvents = ref<Event[]>([]);

  const _updateEvent = (event: Event) => {
    const index = allEvents.value.findIndex((e) => e.id === event.id);
    if (index !== -1) {
      allEvents.value[index] = event;
    }
  };

  const _addEvent = (event: Event) => {
    allEvents.value.push(event);
  };

  const _removeEvent = (event: Event) => {
    const index = allEvents.value.findIndex((e) => e.id === event.id);
    if (index !== -1) {
      allEvents.value.splice(index, 1);
    }
  };

  const _sortEvents = () => {
    allEvents.value.sort((a, b) =>
      a.start_date < b.start_date
        ? -1
        : a.start_date > b.start_date
          ? 1
          : a.name < b.name
            ? -1
            : a.name > b.name
              ? 1
              : 0,
    );
  };

  const _transformDataForEvent = (event: Event) => {
    // transform start_date from yyyy-mm-dd to mm/dd/yyyy
    const startDateParts = event.start_date.split('-');
    const formattedDate =
      startDateParts.length > 1
        ? `${startDateParts[1]}/${startDateParts[2]}/${startDateParts[0]}`
        : event.start_date;
    const endDateParts = event.end_date.split('-');
    const formattedEndDate =
      endDateParts.length > 1
        ? `${endDateParts[1]}/${endDateParts[2]}/${endDateParts[0]}`
        : event.end_date;
    return {
      ...event,
      start_date: formattedDate,
      end_date: formattedEndDate,
      start_time: formatHelpers.convert24to12Hour(event.start_time),
      end_time: formatHelpers.convert24to12Hour(event.end_time),
    };
  };

  const _transformDataForSave = (event: Event) => {
    // Convert times from 12-hour to 24-hour format for database storage
    event.start_time = formatHelpers.convert12to24Hour(event.start_time);
    event.end_time = formatHelpers.convert12to24Hour(event.end_time);
  };

  const fetchEvents = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;

      const { data, error } = await supabaseClient
        .from('events')
        .select('*')
        .eq('season', seasonsStore.currentSeason.id)
        .order('start_date');

      if (error) throw error;
      allEvents.value = data.map(_transformDataForEvent) ?? [];
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const insertEvent = async (event: Omit<Event, 'id' | 'created_at'>) => {
    if (!user.value?.id) {
      notificationHelpers.addError(new Error('No user found'));
      return;
    }

    _transformDataForSave(event as Event);
    try {
      const { data, error } = await supabaseClient
        .from('events')
        .insert({ ...event, profile: user.value.id })
        .select()
        .single();

      if (error) throw error;

      _addEvent(_transformDataForEvent(data) as Event);
      _sortEvents();
      notificationHelpers.addSuccess('Event Created');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const upsertEvent = async (event: Event) => {
    _transformDataForSave(event);
    try {
      const { data, error } = await supabaseClient
        .from('events')
        .upsert(event)
        .select()
        .single();

      if (error) throw error;

      _updateEvent(_transformDataForEvent(data) as Event);
      _sortEvents();
      notificationHelpers.addSuccess('Event Updated');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const deleteEvent = async (event: Event) => {
    try {
      const { error } = await supabaseClient
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      _removeEvent(event);
      notificationHelpers.addSuccess('Event Deleted');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const getEventsRequiringFormForGirl = (
    formId: number,
    girlId: number,
  ): Event[] => {
    return allEvents.value.filter(
      (e) =>
        (e.forms ?? []).includes(formId) && (e.girls ?? []).includes(girlId),
    );
  };

  const getRequiredFormsForEventsForGirl = (girlId: number): number[] => {
    const eventsForGirl = allEvents.value.filter((e) =>
      (e.girls ?? []).includes(girlId),
    );
    const requiredForms = new Set<number>();
    eventsForGirl.forEach((event) => {
      (event.forms ?? []).forEach((formId) => {
        const formIsForGirls =
          formsStore.allForms.find((f) => f.id === formId)?.who === 'girl' ||
          formsStore.allForms.find((f) => f.id === formId)?.who === 'all';
        if (formIsForGirls) {
          requiredForms.add(formId);
        }
      });
    });
    return Array.from(requiredForms);
  };

  const getRequiredFormsForEventsForAdult = (adultId: number): number[] => {
    const eventsForAdult = allEvents.value.filter((e) =>
      (e.adults ?? []).includes(adultId),
    );
    const requiredForms = new Set<number>();
    eventsForAdult.forEach((event) => {
      (event.forms ?? []).forEach((formId) => {
        const formIsForAdults =
          formsStore.allForms.find((f) => f.id === formId)?.who === 'adult' ||
          formsStore.allForms.find((f) => f.id === formId)?.who === 'all';
        if (formIsForAdults) {
          requiredForms.add(formId);
        }
      });
    });
    return Array.from(requiredForms);
  };

  const getEventsRequiringFormForAdult = (
    formId: number,
    adultId: number,
  ): Event[] => {
    return allEvents.value.filter(
      (e) =>
        (e.forms ?? []).includes(formId) && (e.adults ?? []).includes(adultId),
    );
  };

  const formatEventDateTimeForDisplay = (event: Event): string => {
    // transform start_date from yyyy-mm-dd to mmm dd, yyyy
    const formattedStartDate = formatHelpers.formatDate(event.start_date);
    const formattedEndDate = formatHelpers.formatDate(event.end_date);
    // If there is a start and end date and a start and end time, return the full range. If there is only a start and end date, return that. If there is only a start date, return that.
    if (
      event.start_date &&
      event.end_date &&
      event.start_time &&
      event.end_time &&
      event.start_date !== event.end_date
    ) {
      return `${formattedStartDate} ${event.start_time} - ${formattedEndDate} ${event.end_time}`;
    }
    if (
      event.start_date &&
      event.end_date &&
      event.start_time &&
      event.end_time &&
      event.start_date === event.end_date
    ) {
      return `${formattedStartDate} ${event.start_time} - ${event.end_time}`;
    }
    if (
      event.start_date &&
      event.end_date &&
      event.start_time &&
      !event.end_time &&
      event.start_date === event.end_date
    ) {
      return `${formattedStartDate} ${event.start_time}`;
    }
    if (event.start_date && event.start_date !== event.end_date) {
      return `${formattedStartDate} - ${formattedEndDate}`;
    }
    return formattedStartDate;
  };

  return {
    allEvents,
    fetchEvents,
    insertEvent,
    upsertEvent,
    deleteEvent,
    getEventsRequiringFormForGirl,
    getEventsRequiringFormForAdult,
    getRequiredFormsForEventsForGirl,
    getRequiredFormsForEventsForAdult,
    formatEventDateTimeForDisplay,
  };
});
