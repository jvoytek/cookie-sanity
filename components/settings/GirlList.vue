<script setup>
  import { FilterMatchMode } from '@primevue/core/api';
  import { useToast } from 'primevue/usetoast';
  import { useGirlsStore } from '@/stores/girls';

  const loading = ref(true);

  loading.value = true;

  const profileStore = useProfileStore();
  const girlsStore = useGirlsStore();
  const seasonsStore = useSeasonsStore();

  loading.value = false;

  const toast = useToast();
  const dt = ref();
  const girlDialog = ref(false);
  const deleteGirlDialog = ref(false);
  const copyGirlsDialogVisible = ref(false);
  const girl = ref({});
  const selectedGirls = ref();
  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const submitted = ref(false);

  // Check if there are other seasons to copy from
  const hasOtherSeasons = computed(() => {
    return seasonsStore.allSeasons.length > 1;
  });

  function openNew() {
    girl.value = {
      season: profileStore.currentProfile.season,
    };
    submitted.value = false;
    girlDialog.value = true;
  }

  function openCopyFromSeason() {
    copyGirlsDialogVisible.value = true;
  }

  function hideDialog() {
    girlDialog.value = false;
    submitted.value = false;
  }

  async function saveGirl() {
    submitted.value = true;
    if (girl?.value.first_name?.trim()) {
      if (girl.value.id) {
        girlsStore.upsertGirl(girl.value);
      } else {
        girlsStore.insertGirl(girl.value);
      }
      girlDialog.value = false;
      girl.value = {};
    }
  }

  function editGirl(g) {
    girl.value = { ...g };
    girlDialog.value = true;
  }

  function confirmDeleteGirl(g) {
    girl.value = g;
    deleteGirlDialog.value = true;
  }

  async function deleteGirl() {
    try {
      girlsStore.deleteGirl(girl.value);
      deleteGirlDialog.value = false;
      girl.value = {};
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message,
        life: 3000,
      });
    }
  }
</script>

<template>
  <div class="col-span-12">
    <div class="card">
      <h5>Girl Settings</h5>

      <div>
        <div class="card">
          <Toolbar class="mb-6">
            <template #start>
              <Button
                label="New"
                icon="pi pi-plus"
                severity="secondary"
                class="mr-2"
                @click="openNew"
              />
              <Button
                v-if="hasOtherSeasons"
                label="Add from other season"
                icon="pi pi-copy"
                severity="secondary"
                variant="outlined"
                @click="openCopyFromSeason"
              />
            </template>
          </Toolbar>

          <DataTable
            ref="dt"
            v-model:selection="selectedGirls"
            :value="girlsStore.allGirls"
            data-key="id"
            :filters="filters"
            sort-field="first_name"
          >
            <template #header>
              <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Manage Girls</h4>
                <IconField>
                  <InputIcon>
                    <i class="pi pi-search" />
                  </InputIcon>
                  <InputText
                    v-model="filters['global'].value"
                    placeholder="Search..."
                  />
                </IconField>
              </div>
            </template>

            <Column field="first_name" header="First Name" sortable />
            <Column field="last_name" header="Last Name" sortable />
            <Column field="preferred_name" header="Preferred Name" sortable />
            <Column field="email" header="Email" sortable />
            <Column :exportable="false" nowrap>
              <template #body="slotProps">
                <Button
                  v-tooltip.bottom="{ value: 'Edit', showDelay: 500 }"
                  aria-label="Edit"
                  icon="pi pi-pencil"
                  class="mr-2"
                  variant="outlined"
                  severity="secondary"
                  @click="editGirl(slotProps.data)"
                />
                <Button
                  v-tooltip.bottom="{ value: 'Delete', showDelay: 500 }"
                  aria-label="Delete"
                  icon="pi pi-trash"
                  class="mr-2"
                  variant="outlined"
                  severity="warn"
                  @click="confirmDeleteGirl(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>
        </div>

        <Dialog
          v-model:visible="girlDialog"
          :style="{ width: '450px' }"
          header="Girl Details"
          :modal="true"
        >
          <div class="flex flex-col gap-6">
            <div>
              <label for="first_name" class="block font-bold mb-3"
                >First Name</label
              >
              <InputText
                id="first_name"
                v-model.trim="girl.first_name"
                required="true"
                autofocus
                :invalid="submitted && !girl.first_name"
                fluid
              />
              <small v-if="submitted && !girl.first_name" class="text-red-500"
                >First Name is required.</small
              >
            </div>
            <div>
              <label for="last_name" class="block font-bold mb-3"
                >Last Name</label
              >
              <InputText
                id="last_name"
                v-model.trim="girl.last_name"
                required="true"
                autofocus
                :invalid="submitted && !girl.last_name"
                fluid
              />
              <small v-if="submitted && !girl.last_name" class="text-red-500"
                >Last Name is required.</small
              >
            </div>
            <div>
              <label for="preferred_name" class="block font-bold mb-3"
                >Preferred Name</label
              >
              <InputText
                id="preferred_name"
                v-model.trim="girl.preferred_name"
                autofocus
                :invalid="submitted && !girl.preferred_name"
                fluid
              />
            </div>
            <div>
              <label for="email" class="block font-bold mb-3">Email</label>
              <InputText id="email" v-model.trim="girl.email" autofocus fluid />
            </div>
          </div>

          <template #footer>
            <Button
              label="Cancel"
              icon="pi pi-times"
              text
              @click="hideDialog"
            />
            <Button label="Save" icon="pi pi-check" @click="saveGirl" />
          </template>
        </Dialog>

        <Dialog
          v-model:visible="deleteGirlDialog"
          :style="{ width: '450px' }"
          header="Confirm"
          :modal="true"
        >
          <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span v-if="girl"
              >Are you sure you want to delete <b>{{ girl.first_name }}</b
              >?</span
            >
          </div>
          <template #footer>
            <Button
              label="No"
              icon="pi pi-times"
              text
              @click="deleteGirlDialog = false"
            />
            <Button label="Yes" icon="pi pi-check" @click="deleteGirl" />
          </template>
        </Dialog>

        <CopyGirlsDialog v-model:visible="copyGirlsDialogVisible" />
      </div>
    </div>
  </div>
</template>
