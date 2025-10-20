<script setup>
import { DataTable } from 'primevue';

const seasonsStore = useSeasonsStore();
const cookiesStore = useCookiesStore();
const seasonDialog = ref(false);
const season = ref({});
const seasonSubmitted = ref(false);
const isDeleteConfirmed = ref(false);
//const selectedSeason = ref();

//const deleteProductDialog = ref(false);

function openNewSeason() {
  seasonsStore.setActiveSeason(null);
  seasonsStore.showDialog();
}

function deleteConfirmed() {
  seasonsStore.deleteSeason();
  isDeleteConfirmed.value = false;
}
</script>

<template>
  <div class="col-span-12">
    <div class="card">
      <h5>Seasons</h5>

      <div>
        <div class="card">
          <Toolbar class="mb-6">
            <template #start>
              <Button
                label="New"
                icon="pi pi-plus"
                severity="secondary"
                class="mr-2"
                @click="openNewSeason"
              />
            </template>
          </Toolbar>
          <DataTable
            ref="dt"
            :value="seasonsStore.allSeasons"
            dataKey="id"
            :paginator="false"
            sortField="year"
            :sortOrder="-1"
          >
            <Column
              field="troop_number"
              header="Troop Number"
              :sortable="true"
            />
            <Column field="year" header="Year" :sortable="true" />
            <Column header="Actions">
              <template #body="slotProps">
                <Button
                  v-tooltip.bottom="{ value: 'Edit', showDelay: 500 }"
                  aria-label="Edit"
                  icon="pi pi-pencil"
                  class="mr-2"
                  variant="outlined"
                  severity="secondary"
                  @click="seasonsStore.editSeason(slotProps.data)"
                />
                <Button
                  v-tooltip.bottom="{ value: 'Delete', showDelay: 500 }"
                  aria-label="Delete"
                  icon="pi pi-trash"
                  class="mr-2"
                  variant="outlined"
                  severity="warn"
                  @click="seasonsStore.confirmDeleteSeason(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>
  </div>

  <Dialog
    v-model:visible="seasonsStore.deleteSeasonDialogVisible"
    :style="{ width: '450px' }"
    header="Confirm"
    :modal="true"
  >
    <div class="flex items-center gap-4">
      <i class="pi pi-exclamation-triangle !text-3xl" />
      <div>
        <span v-if="seasonsStore.activeSeason"
          >Are you sure you want to delete the season for
          <b
            >{{ seasonsStore.activeSeason.troop_number }} -
            {{ seasonsStore.activeSeason.year }}</b
          >? You will lose all data associated with this season.<br />
        </span>
        <div class="mt-3 items-center gap-2 flex">
          <ToggleSwitch v-model="isDeleteConfirmed" />
          <Message severity="error" variant="simple"
            >I'm sure I want to delete this season.</Message
          >
        </div>
      </div>
    </div>
    <template #footer>
      <br />
      <Button
        label="No"
        icon="pi pi-times"
        text
        @click="seasonsStore.deleteSeasonDialogVisible = false"
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        @click="deleteConfirmed"
        :disabled="!isDeleteConfirmed"
      />
    </template>
  </Dialog>
</template>
