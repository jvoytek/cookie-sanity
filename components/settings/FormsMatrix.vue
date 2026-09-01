<script setup lang="ts">
  import type { Adult, Girl } from '@/types/types';
  import { forms } from 'happy-dom/lib/PropertySymbol';

  const formsStore = useFormsStore();
  const girlsStore = useGirlsStore();
  const adultsStore = useAdultsStore();
  const eventsStore = useEventsStore();
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

  function isFormRequiredForGirl(girl: Girl, formId: number): boolean {
    return (
      eventsStore.getEventsRequiringFormForGirl(formId, girl.id).length > 0 ||
      formsStore.requiredGirlForms.some((f) => f.id === formId)
    );
  }

  function isFormRequiredForAdult(adult: Adult, formId: number): boolean {
    return (
      eventsStore.getEventsRequiringFormForAdult(formId, adult.id).length > 0 ||
      formsStore.requiredAdultForms.some((f) => f.id === formId)
    );
  }

  function getRequiredEventsForGirl(girl: Girl, formId: number): string {
    return eventsStore
      .getEventsRequiringFormForGirl(formId, girl.id)
      .map((e) => e.name)
      .join(', ');
  }

  function getRequiredEventsForAdult(adult: Adult, formId: number): string {
    return eventsStore
      .getEventsRequiringFormForAdult(formId, adult.id)
      .map((e) => e.name)
      .join(', ');
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
      <h5>Girl Forms</h5>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th
                class="text-left p-2 border border-surface-200 bg-surface-100"
              >
                Girl
              </th>
              <th
                v-for="form in girlForms"
                :key="form.id"
                class="text-center p-2 border border-surface-200 bg-surface-100"
                :title="form.name"
              >
                {{ form.abbreviation }}
                <i
                  class="pi pi-question-circle"
                  v-tooltip.bottom="{
                    value: form.name,
                    showDelay: 500,
                  }"
                ></i>
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
                {{ girlsStore.getGirlNameById(girl.id) }}
              </td>
              <td
                v-for="form in girlForms"
                :key="form.id"
                class="text-center p-2 border border-surface-200"
                :class="{
                  'bg-red-50':
                    isFormRequiredForGirl(girl, form.id) &&
                    !girlHasForm(girl, form.id),
                  'bg-green-50':
                    isFormRequiredForGirl(girl, form.id) &&
                    girlHasForm(girl, form.id),
                }"
              >
                <div class="flex flex-col items-center gap-1">
                  <Checkbox
                    :model-value="girlHasForm(girl, form.id)"
                    :binary="true"
                    @update:model-value="toggleGirlForm(girl, form.id)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="adultForms.length > 0 && allAdults.length > 0" class="card">
      <h5>Adult Forms</h5>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th
                class="text-left p-2 border border-surface-200 bg-surface-100"
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
                <i
                  class="pi pi-question-circle"
                  v-tooltip.bottom="{
                    value: form.name,
                    showDelay: 500,
                  }"
                ></i>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="adult in allAdults"
              :key="adult.id"
              class="hover:bg-surface-50"
            >
              <td
                class="p-2 border border-surface-200 flex justify-between items-center gap-2"
              >
                <span
                  class="truncate"
                  @click="$event.currentTarget.classList.toggle('truncate')"
                  >{{ adult.first_name }} {{ adult.last_name[0] }}.</span
                >
                <span v-if="adult.member"
                  ><span
                    ><i class="text-emerald-500 pi pi-heart-fill lg:mr-1" />
                    <span class="text-emerald-500 hidden lg:inline"
                      >Member</span
                    ></span
                  ></span
                >
              </td>
              <td
                v-for="form in adultForms"
                :key="form.id"
                class="text-center p-2 border border-surface-200"
                :class="{
                  'bg-red-50':
                    isFormRequiredForAdult(adult, form.id) &&
                    !adultHasForm(adult, form.id),
                  'bg-green-50':
                    isFormRequiredForAdult(adult, form.id) &&
                    adultHasForm(adult, form.id),
                }"
              >
                <div class="flex flex-col items-center gap-1">
                  <Checkbox
                    :model-value="adultHasForm(adult, form.id)"
                    :binary="true"
                    @update:model-value="toggleAdultForm(adult, form.id)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
