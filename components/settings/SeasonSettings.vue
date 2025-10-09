<script setup>
const seasonsStore = useSeasonsStore();
const cookiesStore = useCookiesStore();
const seasonDialog = ref(false);
const season = ref({});
const seasonSubmitted = ref(false);
//const selectedSeason = ref();

//const deleteProductDialog = ref(false);

function openNewSeason() {
  season.value = {};
  seasonSubmitted.value = false;
  seasonDialog.value = true;
}

async function saveSeason() {
  seasonSubmitted.value = true;

  if (season.value.id) {
    seasonsStore.upsertSeason(season.value);
  } else {
    seasonsStore.insertSeason(season.value);
  }

  seasonDialog.value = false;
  season.value = {};
}

function showSettingsForSeason() {
  cookiesStore.fetchSeasonCookies();
}
</script>

<template>
  <div class="col-span-12">
    <div class="card">
      <h5>Season Settings</h5>
      <Select
        v-model="seasonsStore.settingsSelectedSeason"
        :options="seasonsStore.allSeasons"
        :option-label="seasonsStore.getSeasonName"
        placeholder="Select a Season"
        class="w-full md:w-56"
        @change="showSettingsForSeason"
      />
      <Button
        label="New"
        icon="pi pi-plus"
        severity="secondary"
        class="mr-2"
        @click="openNewSeason"
      />

      <CookieSettings v-if="seasonsStore.settingsSelectedSeason" />
      <Dialog
        v-model:visible="seasonDialog"
        :style="{ width: '450px' }"
        header="Season Details"
        :modal="true"
      >
        <div class="flex flex-col gap-6">
          <div>
            <label for="name" class="block font-bold mb-3">Troop Number</label>
            <InputText
              id="troop_number"
              v-model.trim="season.troop_number"
              required="true"
              autofocus
              :invalid="seasonSubmitted && !season.troop_number"
              fluid
            />
            <small
              v-if="seasonSubmitted && !season.troop_number"
              class="text-red-500"
              >Troop Number is required.</small
            >
          </div>
          <div>
            <label for="name" class="block font-bold mb-3">Year</label>
            <DatePicker
              v-model="season.year"
              date-format="yy"
              required="true"
              :invalid="seasonSubmitted && !season.year"
              fluid
            />
            <small v-if="seasonSubmitted && !season.year" class="text-red-500">
              Year is required.</small
            >
          </div>
        </div>

        <template #footer>
          <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
          <Button label="Save" icon="pi pi-check" @click="saveSeason" />
        </template>
      </Dialog>
    </div>
  </div>
</template>
