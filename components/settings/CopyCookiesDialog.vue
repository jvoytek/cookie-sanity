<script setup lang="ts">
  import type { Cookie, Season } from '@/types/types';

  defineProps<{
    visible: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
  }>();

  const cookiesStore = useCookiesStore();
  const seasonsStore = useSeasonsStore();

  const selectedSeason = ref<Season | null>(null);
  const availableCookies = ref<Cookie[]>([]);
  const selectedCookies = ref<Cookie[]>([]);
  const loading = ref(false);

  // Get seasons that have cookies (excluding current season)
  const availableSeasons = computed(() => {
    return seasonsStore.allSeasons.filter(
      (season) => season.id !== seasonsStore.currentSeason?.id,
    );
  });

  const canSave = computed(() => {
    return selectedCookies.value.length > 0;
  });

  const handleSeasonChange = async () => {
    if (selectedSeason.value) {
      loading.value = true;
      availableCookies.value = await cookiesStore.fetchCookiesBySeason(
        selectedSeason.value.id,
      );
      loading.value = false;
    }
  };

  const handleSave = async () => {
    if (!seasonsStore.currentSeason?.id) return;

    loading.value = true;
    await cookiesStore.copyCookiesFromSeason(
      selectedCookies.value,
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
      selectedSeason.value = null;
      availableCookies.value = [];
      selectedCookies.value = [];
    }, DIALOG_ANIMATION_DURATION);
  };
</script>

<template>
  <Dialog
    :visible="visible"
    :style="{ width: '600px' }"
    header="Copy Cookies from Previous Season"
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
          :on-change="handleSeasonChange"
          fluid
        />
      </div>
    </div>
    <div v-if="selectedSeason" class="flex flex-col gap-4 py-6">
      <div class="text-center mb-4">
        <p class="text-surface-600 dark:text-surface-400">
          Select the cookies you want to copy to the current season
        </p>
      </div>
      <div v-if="loading" class="text-center py-8">
        <ProgressSpinner />
      </div>
      <div v-else-if="availableCookies.length === 0" class="text-center py-8">
        <p class="text-surface-500">No cookies found in the selected season</p>
      </div>
      <DataTable
        v-else
        v-model:selection="selectedCookies"
        :value="availableCookies"
        data-key="id"
        scrollable
        scroll-height="300px"
      >
        <Column selection-mode="multiple" header-style="width: 3rem" />
        <Column field="name" header="Name" sortable />
        <Column field="abbreviation" header="Abbreviation" sortable />
        <Column field="price" header="Price" sortable>
          <template #body="slotProps">
            ${{ slotProps.data.price?.toFixed(2) || '0.00' }}
          </template>
        </Column>
      </DataTable>
    </div>
    <template #footer>
      <Button label="Cancel" icon="pi pi-times" text @click="handleClose" />
      <Button
        label="Copy Cookies"
        icon="pi pi-check"
        :disabled="!canSave"
        @click="handleSave"
      />
    </template>
  </Dialog>
</template>
