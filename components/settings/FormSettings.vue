<script setup lang="ts">
  import { FilterMatchMode } from '@primevue/core/api';
  import { useFormKitNodeById } from '@formkit/vue';

  const formsStore = useFormsStore();
  const seasonsStore = useSeasonsStore();

  const formDialogVisible = ref(false);
  const deleteFormDialog = ref(false);
  const form = ref<Record<string, unknown>>({});
  const submitted = ref(false);
  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const whoOptions = [
    { label: 'Girl', value: 'girl' },
    { label: 'Adult', value: 'adult' },
    { label: 'All', value: 'all' },
  ];

  function openNew() {
    form.value = {
      season: seasonsStore.currentSeason?.id,
      who: 'all',
      required: false,
    };
    submitted.value = false;
    formDialogVisible.value = true;
  }

  function hideDialog() {
    formDialogVisible.value = false;
    submitted.value = false;
  }

  async function saveForm() {
    submitted.value = true;
    if (form?.value.name && form.value.abbreviation) {
      if (form.value.id) {
        await formsStore.upsertForm(form.value as never);
      } else {
        await formsStore.insertForm(form.value as never);
      }
      formDialogVisible.value = false;
      form.value = {};
    }
  }

  function editForm(f: Record<string, unknown>) {
    form.value = { ...f };
    formDialogVisible.value = true;
  }

  function confirmDeleteForm(f: Record<string, unknown>) {
    form.value = f;
    deleteFormDialog.value = true;
  }

  async function deleteForm() {
    await formsStore.deleteForm(form.value as never);
    deleteFormDialog.value = false;
    form.value = {};
  }

  const formDialogFormSchema = [
    {
      $formkit: 'primeInputText',
      name: 'name',
      label: 'Name',
      key: 'name',
      placeholder: 'Enter form name',
      validation: 'required',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeInputText',
      name: 'abbreviation',
      label: 'Abbreviation',
      key: 'abbreviation',
      placeholder: 'Enter abbreviation',
      validation: 'required',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeInputText',
      name: 'url',
      label: 'URL',
      key: 'url',
      placeholder: 'Enter form URL (optional)',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeSelect',
      name: 'who',
      label: 'Who',
      key: 'who',
      options: whoOptions,
      'option-label': 'label',
      'option-value': 'value',
      placeholder: 'Select who this form applies to',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeCheckbox',
      name: 'required',
      label: 'Required',
      key: 'required',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
    },
  ];

  const formNode = useFormKitNodeById('form-settings-form');

  const submitHandler = () => {
    saveForm();
  };

  const submitButtonClickHandler = () => {
    if (formNode.value) formNode.value.submit();
  };
</script>

<template>
  <div class="col-span-12">
    <div class="card">
      <h5>Form Settings</h5>
      <p>
        Manage forms that girls and adults are required to submit. Forms can be
        specific to girls, adults, or both.
      </p>

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

          <div class="hidden lg:block">
          <DataTable
            :value="formsStore.allForms"
            data-key="id"
            :filters="filters"
            sort-field="name"
          >
            <template #header>
              <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Manage Forms</h4>
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

            <Column field="name" header="Name" sortable />
            <Column field="abbreviation" header="Abbreviation" sortable />
            <Column field="url" header="URL" sortable>
              <template #body="slotProps">
                <a
                  v-if="slotProps.data.url"
                  :href="slotProps.data.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary hover:underline"
                >
                  {{ slotProps.data.url }}
                </a>
                <span v-else>—</span>
              </template>
            </Column>
            <Column field="who" header="Who" sortable>
              <template #body="slotProps">
                <Tag
                  :value="
                    slotProps.data.who === 'girl'
                      ? 'Girl'
                      : slotProps.data.who === 'adult'
                        ? 'Adult'
                        : 'All'
                  "
                  :severity="
                    slotProps.data.who === 'girl'
                      ? 'info'
                      : slotProps.data.who === 'adult'
                        ? 'warn'
                        : 'success'
                  "
                />
              </template>
            </Column>
            <Column field="required" header="Required" sortable>
              <template #body="slotProps">
                <i
                  v-if="slotProps.data.required"
                  class="pi pi-check text-green-500"
                />
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
                  @click="editForm(slotProps.data)"
                />
                <Button
                  v-tooltip.bottom="{ value: 'Delete', showDelay: 500 }"
                  aria-label="Delete"
                  icon="pi pi-trash"
                  class="mr-2"
                  variant="outlined"
                  severity="warn"
                  @click="confirmDeleteForm(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>
          </div>
        </div>
      </div>

      <div class="block lg:hidden">
        <Toolbar class="mb-4">
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
        <div
          v-for="f in formsStore.allForms"
          :key="f.id"
          class="card mb-3"
        >
          <div class="flex justify-between items-start mb-2">
            <div>
              <div class="font-bold">{{ f.name }}</div>
              <div class="text-sm text-surface-500">{{ f.abbreviation }}</div>
            </div>
            <div class="flex gap-2">
              <Button
                label="Edit"
                icon="pi pi-pencil"
                severity="secondary"
                aria-label="Edit"
                outlined
                @click="editForm(f)"
              />
              <Button
                icon="pi pi-trash"
                severity="warn"
                aria-label="Delete"
                outlined
                @click="confirmDeleteForm(f)"
              />
            </div>
          </div>
          <div class="flex flex-col gap-1 text-sm">
            <div v-if="f.url">
              <span class="font-semibold">URL: </span>
              <a
                :href="f.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary hover:underline"
              >{{ f.url }}</a>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-semibold">Who: </span>
              <Tag
                :value="f.who === 'girl' ? 'Girl' : f.who === 'adult' ? 'Adult' : 'All'"
                :severity="f.who === 'girl' ? 'info' : f.who === 'adult' ? 'warn' : 'success'"
              />
            </div>
            <div v-if="f.required" class="flex items-center gap-1">
              <i class="pi pi-check text-green-500" />
              <span>Required</span>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        v-model:visible="formDialogVisible"
        :style="{ width: '450px' }"
        header="Form Details"
        :modal="true"
      >
        <div class="flex flex-col gap-6">
          <FormKit
            id="form-settings-form"
            v-model="form"
            type="form"
            :actions="false"
            @submit="submitHandler"
          >
            <FormKitSchema :schema="formDialogFormSchema" />
          </FormKit>
        </div>
        <template #footer>
          <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
          <Button
            label="Save"
            icon="pi pi-check"
            @click="submitButtonClickHandler"
          />
        </template>
      </Dialog>

      <Dialog
        v-model:visible="deleteFormDialog"
        :style="{ width: '450px' }"
        header="Confirm"
        :modal="true"
      >
        <div class="flex items-center gap-4">
          <i class="pi pi-exclamation-triangle !text-3xl" />
          <span v-if="form"
            >Are you sure you want to delete <b>{{ form.name }}</b
            >?</span
          >
        </div>
        <template #footer>
          <Button
            label="No"
            icon="pi pi-times"
            text
            @click="deleteFormDialog = false"
          />
          <Button label="Yes" icon="pi pi-check" @click="deleteForm" />
        </template>
      </Dialog>
    </div>
  </div>
</template>
