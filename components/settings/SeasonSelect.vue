<script setup lang="ts">
const seasonsStore = useSeasonsStore();
const profileStore = useProfileStore();

function openNewSeason() {
  seasonsStore.setActiveSeason(null);
  seasonsStore.showDialog();
}

const saveCurrentSeasonInProfile = async () => {
  await profileStore.saveCurrentSeasonInProfile();
  await profileStore.fetchProfile();
};
</script>
<template>
  <Select
    v-model="seasonsStore.currentSeason"
    :options="seasonsStore.allSeasons"
    :option-label="seasonsStore.getSeasonName"
    placeholder="Select a Season"
    @change="saveCurrentSeasonInProfile"
  >
    <template #footer>
      <div class="p-3">
        <Button
          label="Add New"
          fluid
          severity="secondary"
          variant="text"
          size="small"
          icon="pi pi-plus"
          @click="openNewSeason"
        />
      </div>
    </template>
  </Select>

  <SeasonDialog />
</template>
