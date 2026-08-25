<script setup lang="ts">
  import { FilterMatchMode } from '@primevue/core/api';
  import { useFormKitNodeById } from '@formkit/vue';
  import type { Event } from '@/types/types';

  const eventsStore = useEventsStore();
  const seasonsStore = useSeasonsStore();
  const girlsStore = useGirlsStore();
  const adultsStore = useAdultsStore();
  const formsStore = useFormsStore();

  const eventDialogVisible = ref(false);
  const deleteEventDialog = ref(false);
  const event = ref<Record<string, unknown>>({});
  const submitted = ref(false);
  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  function openNew() {
    event.value = {
      season: seasonsStore.currentSeason?.id,
      forms: [],
      girls: [],
      adults: [],
    };
    submitted.value = false;
    eventDialogVisible.value = true;
  }

  function hideDialog() {
    eventDialogVisible.value = false;
    submitted.value = false;
  }

  async function saveEvent() {
    submitted.value = true;
    if (event.value.name && event.value.start_date && event.value.end_date) {
      if (event.value.id) {
        await eventsStore.upsertEvent(event.value as unknown as Event);
      } else {
        await eventsStore.insertEvent(
          event.value as unknown as Omit<Event, 'id' | 'created_at'>,
        );
      }
      eventDialogVisible.value = false;
      event.value = {};
    }
  }

  function editEvent(e: Record<string, unknown>) {
    event.value = { ...e };
    eventDialogVisible.value = true;
  }

  function confirmDeleteEvent(e: Record<string, unknown>) {
    event.value = e;
    deleteEventDialog.value = true;
  }

  async function deleteEvent() {
    await eventsStore.deleteEvent(event.value as unknown as Event);
    deleteEventDialog.value = false;
    event.value = {};
  }

  const eventDialogFormSchema = computed(() => [
    {
      $formkit: 'primeInputText',
      name: 'name',
      label: 'Name',
      key: 'name',
      placeholder: 'Enter event name',
      validation: 'required',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeDatePicker',
      name: 'start_date',
      label: 'Start Date',
      key: 'start_date',
      placeholder: 'Select start date',
      validation: 'required',
      dateFormat: 'yy-mm-dd',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeDatePicker',
      name: 'end_date',
      label: 'End Date',
      key: 'end_date',
      placeholder: 'Select end date',
      validation: 'required',
      dateFormat: 'yy-mm-dd',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeInputText',
      name: 'start_time',
      label: 'Start Time',
      key: 'start_time',
      placeholder: 'HH:MM (optional)',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeInputText',
      name: 'end_time',
      label: 'End Time',
      key: 'end_time',
      placeholder: 'HH:MM (optional)',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeMultiSelect',
      name: 'forms',
      label: 'Required Forms',
      key: 'forms',
      options: formsStore.formOptions,
      'option-label': 'label',
      'option-value': 'value',
      placeholder: 'Select required forms (optional)',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeMultiSelect',
      name: 'girls',
      label: 'Girls Attending',
      key: 'girls',
      options: girlsStore.allGirls.map((g) => ({
        label: `${g.first_name} ${g.last_name}`,
        value: g.id,
      })),
      'option-label': 'label',
      'option-value': 'value',
      placeholder: 'Select attending girls (optional)',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeMultiSelect',
      name: 'adults',
      label: 'Adults Attending',
      key: 'adults',
      options: adultsStore.allAdults.map((a) => ({
        label: `${a.first_name} ${a.last_name}`,
        value: a.id,
      })),
      'option-label': 'label',
      'option-value': 'value',
      placeholder: 'Select attending adults (optional)',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
  ]);

  const formNode = useFormKitNodeById('event-settings-form');

  const submitHandler = () => {
    saveEvent();
  };

  const submitButtonClickHandler = () => {
    if (formNode.value) formNode.value.submit();
  };
</script>

<template>
  <div class="col-span-12">
    <div class="card">
      <h5>Event Settings</h5>
      <p>
        Manage events that girls and adults are attending. Specify which forms
        are required for each event.
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

          <DataTable
            :value="eventsStore.allEvents"
            data-key="id"
            :filters="filters"
            sort-field="start_date"
          >
            <template #header>
              <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Manage Events</h4>
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
            <Column field="start_date" header="Start Date" sortable />
            <Column field="end_date" header="End Date" sortable />
            <Column field="start_time" header="Start Time" sortable>
              <template #body="slotProps">
                {{ slotProps.data.start_time ?? '—' }}
              </template>
            </Column>
            <Column field="end_time" header="End Time" sortable>
              <template #body="slotProps">
                {{ slotProps.data.end_time ?? '—' }}
              </template>
            </Column>
            <Column header="Forms Required">
              <template #body="slotProps">
                {{
                  formsStore.getFormNamesByIdList(slotProps.data.forms) || '—'
                }}
              </template>
            </Column>
            <Column header="Girls">
              <template #body="slotProps">
                {{ slotProps.data.girls?.length ?? 0 }}
              </template>
            </Column>
            <Column header="Adults">
              <template #body="slotProps">
                {{ slotProps.data.adults?.length ?? 0 }}
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
                  @click="editEvent(slotProps.data)"
                />
                <Button
                  v-tooltip.bottom="{ value: 'Delete', showDelay: 500 }"
                  aria-label="Delete"
                  icon="pi pi-trash"
                  class="mr-2"
                  variant="outlined"
                  severity="warn"
                  @click="confirmDeleteEvent(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <Dialog
        v-model:visible="eventDialogVisible"
        :style="{ width: '500px' }"
        header="Event Details"
        :modal="true"
      >
        <div class="flex flex-col gap-6">
          <FormKit
            id="event-settings-form"
            v-model="event"
            type="form"
            :actions="false"
            @submit="submitHandler"
          >
            <FormKitSchema :schema="eventDialogFormSchema" />
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
        v-model:visible="deleteEventDialog"
        :style="{ width: '450px' }"
        header="Confirm"
        :modal="true"
      >
        <div class="flex items-center gap-4">
          <i class="pi pi-exclamation-triangle !text-3xl" />
          <span v-if="event"
            >Are you sure you want to delete <b>{{ event.name }}</b
            >?</span
          >
        </div>
        <template #footer>
          <Button
            label="No"
            icon="pi pi-times"
            text
            @click="deleteEventDialog = false"
          />
          <Button label="Yes" icon="pi pi-check" @click="deleteEvent" />
        </template>
      </Dialog>
    </div>
  </div>
</template>
