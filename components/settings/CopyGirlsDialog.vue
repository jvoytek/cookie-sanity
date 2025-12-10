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

  // Dialog animation duration in milliseconds
  const DIALOG_ANIMATION_DURATION = 300;

  const handleClose = () => {
    emit('update:visible', false);
    // Reset state after dialog animation completes
    setTimeout(() => {
      activeStep.value = 0;
      selectedSeason.value = null;
      availableGirls.value = [];
      selectedGirls.value = [];
    }, DIALOG_ANIMATION_DURATION);
  };
</script>

<template>
  <Dialog
    :visible="visible"
    :style="{ width: '600px' }"
    header="Copy Girls from Previous Season"
    :modal="true"
    @update:visible="handleClose"
  >
    <div class="flex flex-col gap-4 py-6">
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
          :onChange="handleSeasonChange"
          fluid
        />
      </div>
    </div>
    <div class="flex flex-col gap-4 py-6" v-if="selectedSeason">
      <div class="text-center mb-4">
        <p class="text-surface-600 dark:text-surface-400">
          Select the girls you want to copy to the current season
        </p>
      </div>
      <div v-if="loading" class="text-center py-8">
        <ProgressSpinner />
      </div>
      <div v-else-if="availableGirls.length === 0" class="text-center py-8">
        <p class="text-surface-500">No girls found in the selected season</p>
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
      </DataTable>
    </div>
    <template #footer>
      <Button label="Cancel" icon="pi pi-times" text @click="handleClose" />
      <Button
        label="Copy Girls"
        icon="pi pi-check"
        :disabled="!canSave"
        @click="handleSave"
      />
    </template>
  </Dialog>
</template>
