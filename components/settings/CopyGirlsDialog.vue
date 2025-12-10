<script setup lang="ts">
  import type { Girl, Season } from '@/types/types';

  defineProps<{
    visible: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
  }>();

  const girlsStore = useGirlsStore();
  const seasonsStore = useSeasonsStore();

  const activeStep = ref(0);
  const selectedSeason = ref<Season | null>(null);
  const availableGirls = ref<Girl[]>([]);
  const selectedGirls = ref<Girl[]>([]);
  const loading = ref(false);

  // Get seasons that have girls (excluding current season)
  const availableSeasons = computed(() => {
    return seasonsStore.allSeasons.filter(
      (season) => season.id !== seasonsStore.currentSeason?.id,
    );
  });

  const canProceedToStep2 = computed(() => {
    return selectedSeason.value !== null;
  });

  const canSave = computed(() => {
    return selectedGirls.value.length > 0;
  });

  const handleSeasonChange = async () => {
    if (selectedSeason.value) {
      loading.value = true;
      availableGirls.value = await girlsStore.fetchGirlsBySeason(
        selectedSeason.value.id,
      );
      loading.value = false;
      // Move to step 2
      activeStep.value = 1;
    }
  };

  const handleSave = async () => {
    if (!seasonsStore.currentSeason?.id) return;

    loading.value = true;
    await girlsStore.copyGirlsFromSeason(
      selectedGirls.value,
      seasonsStore.currentSeason.id,
    );
    loading.value = false;
    handleClose();
  };

  const handleClose = () => {
    emit('update:visible', false);
    // Reset state after dialog closes
    setTimeout(() => {
      activeStep.value = 0;
      selectedSeason.value = null;
      availableGirls.value = [];
      selectedGirls.value = [];
    }, 300);
  };

  const handleBack = () => {
    if (activeStep.value > 0) {
      activeStep.value = 0;
      selectedGirls.value = [];
    }
  };
</script>

<template>
  <Dialog
    :visible="visible"
    :style="{ width: '600px' }"
    header="Copy Girls from Another Season"
    :modal="true"
    @update:visible="handleClose"
  >
    <Stepper v-model:value="activeStep" linear>
      <StepList>
        <Step value="0">Select Season</Step>
        <Step value="1">Select Girls</Step>
      </StepList>
      <StepPanels>
        <StepPanel value="0">
          <div class="flex flex-col gap-4 py-6">
            <div class="text-center mb-4">
              <p class="text-surface-600 dark:text-surface-400">
                Choose the season from which you want to copy girls
              </p>
            </div>
            <div>
              <label for="season-select" class="block font-bold mb-3"
                >Select Season</label
              >
              <Select
                id="season-select"
                v-model="selectedSeason"
                :options="availableSeasons"
                :option-label="seasonsStore.getSeasonName"
                placeholder="Choose a season"
                fluid
              />
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-6">
            <Button
              label="Cancel"
              severity="secondary"
              variant="outlined"
              @click="handleClose"
            />
            <Button
              label="Next"
              icon="pi pi-arrow-right"
              icon-pos="right"
              :disabled="!canProceedToStep2"
              @click="handleSeasonChange"
            />
          </div>
        </StepPanel>
        <StepPanel value="1">
          <div class="flex flex-col gap-4 py-6">
            <div class="text-center mb-4">
              <p class="text-surface-600 dark:text-surface-400">
                Select the girls you want to copy to the current season
              </p>
            </div>
            <div v-if="loading" class="text-center py-8">
              <ProgressSpinner />
            </div>
            <div
              v-else-if="availableGirls.length === 0"
              class="text-center py-8"
            >
              <p class="text-surface-500">
                No girls found in the selected season
              </p>
            </div>
            <DataTable
              v-else
              v-model:selection="selectedGirls"
              :value="availableGirls"
              data-key="id"
              scrollable
              scroll-height="300px"
            >
              <Column selection-mode="multiple" header-style="width: 3rem" />
              <Column field="first_name" header="First Name" sortable />
              <Column field="last_name" header="Last Name" sortable />
              <Column field="email" header="Email" sortable />
            </DataTable>
          </div>
          <div class="flex justify-between gap-2 pt-6">
            <Button
              label="Back"
              severity="secondary"
              icon="pi pi-arrow-left"
              variant="outlined"
              @click="handleBack"
            />
            <div class="flex gap-2">
              <Button
                label="Cancel"
                severity="secondary"
                variant="outlined"
                @click="handleClose"
              />
              <Button
                label="Copy Girls"
                icon="pi pi-check"
                :disabled="!canSave"
                :loading="loading"
                @click="handleSave"
              />
            </div>
          </div>
        </StepPanel>
      </StepPanels>
    </Stepper>
  </Dialog>
</template>
