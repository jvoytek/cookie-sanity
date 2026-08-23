<script setup>
  import { FilterMatchMode } from '@primevue/core/api';
  import { useFormKitNodeById } from '@formkit/vue';

  const loading = ref(true);

  loading.value = true;

  const adultsStore = useAdultsStore();
  const girlsStore = useGirlsStore();
  const seasonsStore = useSeasonsStore();

  loading.value = false;

  const toast = useToast();
  const dt = ref();
  const adultDialog = ref(false);
  const deleteAdultDialog = ref(false);
  const adult = ref({});
  const selectedAdults = ref();
  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const submitted = ref(false);

  function openNew() {
    adult.value = {
      season: seasonsStore.currentSeason.id,
      sellers: [],
    };
    submitted.value = false;
    adultDialog.value = true;
  }

  function hideDialog() {
    adultDialog.value = false;
    submitted.value = false;
  }

  async function saveAdult() {
    submitted.value = true;
    if (adult?.value.first_name?.trim()) {
      adult.value.sellers = adult.value.sellers ?? [];
      if (adult.value.id) {
        adultsStore.upsertAdult(adult.value);
      } else {
        adultsStore.insertAdult(adult.value);
      }
      adultDialog.value = false;
      adult.value = {};
    }
  }

  function editAdult(a) {
    adult.value = { ...a };
    adultDialog.value = true;
  }

  function confirmDeleteAdult(a) {
    adult.value = a;
    deleteAdultDialog.value = true;
  }

  async function deleteAdult() {
    try {
      adultsStore.deleteAdult(adult.value);
      deleteAdultDialog.value = false;
      adult.value = {};
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message,
        life: 3000,
      });
    }
  }

  const adultDialogFormSchema = [
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
    {
      $formkit: 'primeInputText',
      name: 'phone',
      label: 'Phone',
      key: 'phone',
      placeholder: 'Enter phone number (optional)',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeMultiSelect',
      name: 'sellers',
      options: girlsStore.girlOptions,
      'option-label': 'label',
      'option-value': 'value',
      placeholder: 'Select girls',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
      label: 'Related Girls',
      key: 'sellers',
      showToggleAll: false,
    },
  ];

  const formNode = useFormKitNodeById('adult-form');

  const submitHandler = () => {
    saveAdult();
  };

  const submitButtonClickHandler = () => {
    if (formNode.value) formNode.value.submit();
  };
</script>

<template>
  <div class="col-span-12">
    <div class="card">
      <h5>Adult Settings</h5>

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
            </template>
          </Toolbar>

          <DataTable
            ref="dt"
            v-model:selection="selectedAdults"
            :value="adultsStore.allAdults"
            data-key="id"
            :filters="filters"
            sort-field="first_name"
          >
            <template #header>
              <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Manage Adults</h4>
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
            <Column field="phone" header="Phone" sortable />
            <Column header="Related Girls" sortable>
              <template #body="slotProps">
                {{ girlsStore.getGirlNamesByIdList(slotProps.data.sellers) }}
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
                  @click="editAdult(slotProps.data)"
                />
                <Button
                  v-tooltip.bottom="{ value: 'Delete', showDelay: 500 }"
                  aria-label="Delete"
                  icon="pi pi-trash"
                  class="mr-2"
                  variant="outlined"
                  severity="warn"
                  @click="confirmDeleteAdult(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>
        </div>

        <Dialog
          v-model:visible="adultDialog"
          :style="{ width: '450px' }"
          header="Adult Details"
          :modal="true"
        >
          <div class="flex flex-col gap-6">
            <FormKit
              id="adult-form"
              v-model="adult"
              type="form"
              :actions="false"
              @submit="submitHandler"
            >
              <FormKitSchema :schema="adultDialogFormSchema" />
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
          v-model:visible="deleteAdultDialog"
          :style="{ width: '450px' }"
          header="Confirm"
          :modal="true"
        >
          <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span v-if="adult"
              >Are you sure you want to delete <b>{{ adult.first_name }}</b
              >?</span
            >
          </div>
          <template #footer>
            <Button
              label="No"
              icon="pi pi-times"
              text
              @click="deleteAdultDialog = false"
            />
            <Button label="Yes" icon="pi pi-check" @click="deleteAdult" />
          </template>
        </Dialog>
      </div>
    </div>
  </div>
</template>
