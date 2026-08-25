<script setup lang="ts">
  import type { Adult, Girl } from '@/types/types';

  const formsStore = useFormsStore();
  const girlsStore = useGirlsStore();
  const adultsStore = useAdultsStore();
  const notificationHelpers = useNotificationHelpers();
  const supabaseClient = useSupabaseClient();

  const girlForms = computed(() => formsStore.girlForms);
  const adultForms = computed(() => formsStore.adultForms);
  const allGirls = computed(() => girlsStore.allGirls);
  const allAdults = computed(() => adultsStore.allAdults);

  function girlHasForm(girl: Girl, formId: number): boolean {
    return (girl.forms ?? []).includes(formId);
  }

  function adultHasForm(adult: Adult, formId: number): boolean {
    return (adult.forms ?? []).includes(formId);
  }

  async function toggleGirlForm(girl: Girl, formId: number) {
    const girlIndex = girlsStore.allGirls.findIndex((g) => g.id === girl.id);
    if (girlIndex === -1) return;
    const currentForms = [...(girlsStore.allGirls[girlIndex].forms ?? [])];
    const hasForm = currentForms.includes(formId);
    const updatedForms = hasForm
      ? currentForms.filter((id) => id !== formId)
      : [...currentForms, formId];

    try {
      const { error } = await supabaseClient
        .from('sellers')
        .update({ forms: updatedForms })
        .eq('id', girl.id);
      if (error) throw error;
      girlsStore.allGirls[girlIndex].forms = updatedForms;
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  }

  async function toggleAdultForm(adult: Adult, formId: number) {
    const adultIndex = adultsStore.allAdults.findIndex(
      (a) => a.id === adult.id,
    );
    if (adultIndex === -1) return;
    const currentForms = [...(adultsStore.allAdults[adultIndex].forms ?? [])];
    const hasForm = currentForms.includes(formId);
    const updatedForms = hasForm
      ? currentForms.filter((id) => id !== formId)
      : [...currentForms, formId];

    try {
      const { error } = await supabaseClient
        .from('adults')
        .update({ forms: updatedForms })
        .eq('id', adult.id);
      if (error) throw error;
      adultsStore.allAdults[adultIndex].forms = updatedForms;
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  }
</script>

<template>
  <div class="col-span-12">
    <div v-if="girlForms.length > 0 && allGirls.length > 0" class="card mb-6">
      <h2 class="text-xl font-semibold mb-4">Girl Forms</h2>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th
                class="text-left p-2 border border-surface-200 bg-surface-100 min-w-[150px]"
              >
                Girl
              </th>
              <th
                v-for="form in girlForms"
                :key="form.id"
                class="text-center p-2 border border-surface-200 bg-surface-100 min-w-[80px]"
                :title="form.name"
              >
                {{ form.abbreviation }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="girl in allGirls"
              :key="girl.id"
              class="hover:bg-surface-50"
            >
              <td class="p-2 border border-surface-200">
                {{ girl.first_name }} {{ girl.last_name }}
              </td>
              <td
                v-for="form in girlForms"
                :key="form.id"
                class="text-center p-2 border border-surface-200"
              >
                <Checkbox
                  :model-value="girlHasForm(girl, form.id)"
                  :binary="true"
                  @update:model-value="toggleGirlForm(girl, form.id)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="adultForms.length > 0 && allAdults.length > 0" class="card">
      <h2 class="text-xl font-semibold mb-4">Adult Forms</h2>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th
                class="text-left p-2 border border-surface-200 bg-surface-100 min-w-[150px]"
              >
                Adult
              </th>
              <th
                v-for="form in adultForms"
                :key="form.id"
                class="text-center p-2 border border-surface-200 bg-surface-100 min-w-[80px]"
                :title="form.name"
              >
                {{ form.abbreviation }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="adult in allAdults"
              :key="adult.id"
              class="hover:bg-surface-50"
            >
              <td class="p-2 border border-surface-200">
                {{ adult.first_name }} {{ adult.last_name }}
              </td>
              <td
                v-for="form in adultForms"
                :key="form.id"
                class="text-center p-2 border border-surface-200"
              >
                <Checkbox
                  :model-value="adultHasForm(adult, form.id)"
                  :binary="true"
                  @update:model-value="toggleAdultForm(adult, form.id)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
