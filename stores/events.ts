import type { Database } from '@/types/supabase';
import type { Event } from '@/types/types';

export const useEventsStore = defineStore('events', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const notificationHelpers = useNotificationHelpers();

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
      allEvents.value = data ?? [];
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const insertEvent = async (event: Omit<Event, 'id' | 'created_at'>) => {
    if (!user.value?.id) {
      notificationHelpers.addError(new Error('No user found'));
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('events')
        .insert({ ...event, profile: user.value.id })
        .select()
        .single();

      if (error) throw error;

      _addEvent(data as Event);
      _sortEvents();
      notificationHelpers.addSuccess('Event Created');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const upsertEvent = async (event: Event) => {
    try {
      const { data, error } = await supabaseClient
        .from('events')
        .upsert(event)
        .select()
        .single();

      if (error) throw error;

      _updateEvent(data as Event);
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

  const getEventsRequiringFormForAdult = (
    formId: number,
    adultId: number,
  ): Event[] => {
    return allEvents.value.filter(
      (e) =>
        (e.forms ?? []).includes(formId) && (e.adults ?? []).includes(adultId),
    );
  };

  return {
    allEvents,
    fetchEvents,
    insertEvent,
    upsertEvent,
    deleteEvent,
    getEventsRequiringFormForGirl,
    getEventsRequiringFormForAdult,
  };
});
