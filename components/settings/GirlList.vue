<script setup>
  import { FilterMatchMode } from '@primevue/core/api';
  import { useFormKitNodeById } from '@formkit/vue';

  const notificationHelpers = useNotificationHelpers();

  const publishGirlRequestForm = computed({
    get: () => seasonsStore.currentSeason?.publish_girl_request_form ?? false,
    set: async (value) => {
      if (seasonsStore.currentSeason?.id && seasonsStore.currentSeason.id > 0) {
        try {
          await seasonsStore.upsertSeason({
            ...seasonsStore.currentSeason,
            publish_girl_request_form: value,
          });
          await seasonsStore.fetchSeasons();
        } catch (error) {
          notificationHelpers.addError(error);
        }
      }
    },
  });

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

  // Track which request link was copied
  const copiedLinkId = ref(null);
  let copyTimeoutId = null;

  // Check if there are other seasons to copy from
  const hasOtherSeasons = computed(() => {
    return seasonsStore.allSeasons.length > 1;
  });

  // Cleanup timeout on unmount
  onUnmounted(() => {
    if (copyTimeoutId) {
      clearTimeout(copyTimeoutId);
    }
  });

  // Function to get the request form URL for a girl
  function getRequestUrl(girlId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/request?id=${girlId}`;
  }

  // Function to copy the request URL to clipboard
  async function copyRequestUrl(girlId) {
    // Check if clipboard API is available
    if (!navigator.clipboard) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Clipboard API not available in this browser',
        life: 3000,
      });
      return;
    }

    try {
      const url = getRequestUrl(girlId);
      await navigator.clipboard.writeText(url);
      copiedLinkId.value = girlId;

      // Clear any existing timeout
      if (copyTimeoutId) {
        clearTimeout(copyTimeoutId);
      }

      copyTimeoutId = setTimeout(() => {
        copiedLinkId.value = null;
        copyTimeoutId = null;
      }, 2000);
    } catch {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy link to clipboard',
        life: 3000,
      });
    }
  }

  function openNew() {
    girl.value = {
      season: seasonsStore.currentSeason.id,
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

  const girlDialogFormSchema = [
    {
      $formkit: 'primeInputText',
      name: 'first_name',
      label: 'First Name',
      key: 'first_name',
      placeholder: 'Enter first name',
      validation: 'required',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeInputText',
      name: 'last_name',
      label: 'Last Name',
      key: 'last_name',
      placeholder: 'Enter last name',
      validation: 'required',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeInputText',
      name: 'preferred_name',
      label: 'Preferred Name',
      key: 'preferred_name',
      placeholder: 'Enter preferred name (optional)',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeInputText',
      name: 'email',
      label: 'Email',
      key: 'email',
      validation: 'email',
      placeholder: 'Enter email (optional)',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
  ];

  const formNode = useFormKitNodeById('girl-form');

  const submitHandler = () => {
    saveGirl();
  };

  const submitButtonClickHandler = () => {
    if (formNode.value) formNode.value.submit();
  };
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
                label="Copy from previous season"
                icon="pi pi-copy"
                severity="secondary"
                variant="outlined"
                @click="openCopyFromSeason"
              />
              <div class="flex items-center ml-6">
                <label for="publish-girl-request-form" class="mr-2"
                  >Publish Girl Request Form</label
                >
                <ToggleSwitch
                  v-model="publishGirlRequestForm"
                  input-id="publish-girl-request-form"
                />
              </div>
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
            <Column
              v-if="publishGirlRequestForm"
              header="Request Link"
              :exportable="false"
            >
              <template #body="slotProps">
                <div class="flex items-center gap-2">
                  <Button
                    as="a"
                    :href="getRequestUrl(slotProps.data.id)"
                    target="_blank"
                    rel="noopener noreferrer"
                    icon="pi pi-external-link"
                    size="small"
                    variant="outlined"
                    severity="secondary"
                  />
                  <Button
                    v-tooltip.bottom="{
                      value:
                        copiedLinkId === slotProps.data.id
                          ? 'Copied!'
                          : 'Copy Link',
                      showDelay: 500,
                    }"
                    :icon="
                      copiedLinkId === slotProps.data.id
                        ? 'pi pi-check'
                        : 'pi pi-copy'
                    "
                    :aria-label="
                      copiedLinkId === slotProps.data.id
                        ? 'Copied'
                        : 'Copy Link'
                    "
                    size="small"
                    variant="outlined"
                    severity="secondary"
                    @click="copyRequestUrl(slotProps.data.id)"
                  />
                </div>
              </template>
            </Column>
            <Column :exportable="false" header="Actions" nowrap>
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
            <FormKit
              id="girl-form"
              v-model="girl"
              type="form"
              :actions="false"
              @submit="submitHandler"
            >
              <!-- Render the dynamic form using the schema -->
              <FormKitSchema :schema="girlDialogFormSchema" />
            </FormKit>
          </div>
          <template #footer>
            <Button
              label="Cancel"
              icon="pi pi-times"
              text
              @click="hideDialog"
            />
            <Button
              label="Save"
              icon="pi pi-check"
              @click="submitButtonClickHandler"
            />
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
