import type { Database } from '@/types/supabase';
import type { Form } from '@/types/types';

export const useFormsStore = defineStore('forms', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const notificationHelpers = useNotificationHelpers();

  const allForms = ref<Form[]>([]);

  const girlForms = computed(() =>
    allForms.value.filter((f) => f.who === 'girl' || f.who === 'all'),
  );

  const adultForms = computed(() =>
    allForms.value.filter((f) => f.who === 'adult' || f.who === 'all'),
  );

  const formOptions = computed(() =>
    allForms.value.map((f) => ({
      label: `${f.name} (${f.abbreviation})`,
      value: f.id,
    })),
  );

  const girlFormOptions = computed(() =>
    girlForms.value.map((f) => ({
      label: `${f.name} (${f.abbreviation})`,
      value: f.id,
    })),
  );

  const adultFormOptions = computed(() =>
    adultForms.value.map((f) => ({
      label: `${f.name} (${f.abbreviation})`,
      value: f.id,
    })),
  );

  const _updateForm = (form: Form) => {
    const index = allForms.value.findIndex((f) => f.id === form.id);
    if (index !== -1) {
      allForms.value[index] = form;
    }
  };

  const _addForm = (form: Form) => {
    allForms.value.push(form);
  };

  const _removeForm = (form: Form) => {
    const index = allForms.value.findIndex((f) => f.id === form.id);
    if (index !== -1) {
      allForms.value.splice(index, 1);
    }
  };

  const _sortForms = () => {
    allForms.value.sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    );
  };

  const fetchForms = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;

      const { data, error } = await supabaseClient
        .from('forms')
        .select('*')
        .eq('season', seasonsStore.currentSeason.id)
        .order('name');

      if (error) throw error;
      allForms.value = data ?? [];
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const insertForm = async (form: Omit<Form, 'id' | 'created_at'>) => {
    if (!user.value?.id) {
      notificationHelpers.addError(new Error('No user found'));
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('forms')
        .insert({ ...form, profile: user.value.id })
        .select()
        .single();

      if (error) throw error;

      _addForm(data as Form);
      _sortForms();
      notificationHelpers.addSuccess('Form Created');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const upsertForm = async (form: Form) => {
    try {
      const { error } = await supabaseClient.from('forms').upsert(form);

      if (error) throw error;

      _updateForm(form);
      _sortForms();
      notificationHelpers.addSuccess('Form Updated');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const deleteForm = async (form: Form) => {
    try {
      const { error } = await supabaseClient
        .from('forms')
        .delete()
        .eq('id', form.id);

      if (error) throw error;

      _removeForm(form);
      notificationHelpers.addSuccess('Form Deleted');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const getFormNamesByIdList = (idList: number[] | null | undefined) => {
    if (!idList || !Array.isArray(idList)) return '';
    return idList
      .map((id) => {
        const form = allForms.value.find((f) => f.id === id);
        return form ? form.abbreviation : null;
      })
      .filter(Boolean)
      .join(', ');
  };

  return {
    allForms,
    girlForms,
    adultForms,
    formOptions,
    girlFormOptions,
    adultFormOptions,
    fetchForms,
    insertForm,
    upsertForm,
    deleteForm,
    getFormNamesByIdList,
  };
});
