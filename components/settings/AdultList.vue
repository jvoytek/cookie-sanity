<script setup>
  import { FilterMatchMode } from '@primevue/core/api';
  import { useFormKitNodeById } from '@formkit/vue';

  const loading = ref(true);

  loading.value = true;

  const adultsStore = useAdultsStore();
  const girlsStore = useGirlsStore();
  const formsStore = useFormsStore();
  const eventsStore = useEventsStore();
  const seasonsStore = useSeasonsStore();
  const route = useRoute();
  const router = useRouter();

  loading.value = false;

  const toast = useToast();
  const adultDialog = ref(false);
  const deleteAdultDialog = ref(false);
  const relatedGirlDialog = ref(false);
  const selectedRelatedGirl = ref(null);
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

  function openRelatedGirlDialog(girl) {
    selectedRelatedGirl.value = girl;
    relatedGirlDialog.value = true;
  }

  function hideRelatedGirlDialog() {
    selectedRelatedGirl.value = null;
    relatedGirlDialog.value = false;
  }

  function editAdult(a) {
    adult.value = { ...a };
    adultDialog.value = true;
  }

  function emailRelatedGirl(girl) {
    if (girl.email) {
      window.location.href = `mailto:${girl.email}`;
    } else {
      toast.add({
        severity: 'warn',
        summary: 'No Email',
        detail: 'This girl does not have an email address.',
        life: 3000,
      });
    }
  }

  function editRelatedGirl(girl) {
    //hideRelatedAdultDialog();
    const path =
      route.path === '/troop-sanity/adults' ? '/troop-sanity/girls' : '/girls';
    router.push({
      path: path,
      query: { girl: girl.id.toString() },
    });
  }

  function getGirlDisplayName(girl) {
    return `${girl.first_name} ${girl.last_name}${
      girl.preferred_name ? ` (${girl.preferred_name})` : ''
    }`;
  }

  const getAdultIdFromQuery = () => {
    const rawAdultId = route.query?.adult;
    const first = Array.isArray(rawAdultId) ? rawAdultId[0] : rawAdultId;
    if (typeof first !== 'string') return null;
    const parsed = parseInt(first, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const getFormNames = (formIds) => {
    return formIds
      .map((id) => formsStore.allForms.find((form) => form.id === id))
      .filter(Boolean)
      .map((form) => form.name)
      .join(', ');
  };

  const hasMissingForms = (adult) => {
    const requiredEventFormIds = eventsStore.getRequiredFormsForEventsForAdult(
      adult.id,
    );
    const requiredAdultFormIds = formsStore.requiredAdultForms.map((f) => f.id);
    const allRequiredFormIds = [
      ...requiredEventFormIds,
      ...requiredAdultFormIds,
    ];
    return !allRequiredFormIds.every((formId) => adult.forms.includes(formId));
  };

  const getMissingFormNames = (adult) => {
    const requiredEventFormIds = eventsStore.getRequiredFormsForEventsForAdult(
      adult.id,
    );
    const requiredAdultFormIds = formsStore.requiredAdultForms.map((f) => f.id);
    const allRequiredFormIds = [
      ...requiredEventFormIds,
      ...requiredAdultFormIds,
    ];
    const missingFormIds = allRequiredFormIds.filter(
      (formId) => !adult.forms.includes(formId),
    );
    return getFormNames(missingFormIds);
  };

  const openAdultFromQuery = async () => {
    const adultId = getAdultIdFromQuery();
    if (adultId === null) return;

    const relatedAdult = adultsStore.allAdults.find((a) => a.id === adultId);
    if (!relatedAdult) return;

    editAdult(relatedAdult);
    const query = { ...route.query };
    delete query.adult;
    await router.replace({ query });
  };

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
      $formkit: 'primeCheckbox',
      name: 'member',
      label: 'Member',
      key: 'member',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
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
    {
      $formkit: 'primeMultiSelect',
      name: 'forms',
      options: formsStore.adultFormOptions,
      'option-label': 'label',
      'option-value': 'value',
      placeholder: 'Select submitted forms',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
      label: 'Submitted Forms',
      key: 'forms',
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

  watch(
    () => [route.query.adult, adultsStore.allAdults.length],
    () => {
      openAdultFromQuery();
    },
    { immediate: true },
  );
</script>

<template>
  <div class="col-span-12">
    <div class="card">
      <h5>Adults</h5>

      <div>
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
            <Column field="member" header="Member" sortable>
              <template #body="slotProps">
                <i
                  v-if="slotProps.data.member"
                  class="text-emerald-500 pi pi-heart-fill"
                />
              </template>
            </Column>
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
      </div>
    </div>

    <div class="block lg:hidden">
      <div class="card" v-for="adult in adultsStore.allAdults" :key="adult.id">
        <div class="flex justify-between items-center mb-2">
          <div>
            <div class="font-bold">
              {{ adult.first_name }}
              <span v-if="adult.preferred_name"
                >({{ adult.preferred_name }})</span
              >
              {{ adult.last_name }}
            </div>
            <a
              v-if="adult.email"
              :href="`mailto:${adult.email}`"
              class="text-primary hover:underline"
            >
              {{ adult.email }}
            </a>
          </div>
          <div class="flex gap-2">
            <Button
              label="Edit"
              icon="pi pi-pencil"
              severity="secondary"
              aria-lable="Edit"
              outlined
              class="float-right"
              @click="editAdult(adult)"
            />
            <Button
              icon="pi pi-trash"
              severity="warn"
              aria-label="Delete"
              outlined
              class="float-right"
              @click="confirmDeleteAdult(adult)"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div v-if="adult.member">
            <span
              ><i class="text-emerald-500 pi pi-heart-fill mr-1" />
              <span class="text-emerald-500">Member</span></span
            >
          </div>
          <div v-if="girlsStore.getGirlsByIdList(adult.sellers).length > 0">
            <div
              class="border border-gray-200 flex justify-between items-center p-2 rounded-md mb-1"
              v-for="relatedGirl in girlsStore.getGirlsByIdList(adult.sellers)"
              :key="relatedGirl.id"
            >
              <span>
                {{ relatedGirl.first_name }} {{ relatedGirl.last_name }}
              </span>
              <div class="flex gap-2">
                <Button
                  v-if="relatedGirl.email"
                  v-tooltip.bottom="{ value: 'Email', showDelay: 500 }"
                  aria-label="Email"
                  icon="pi pi-envelope"
                  size="small"
                  severity="secondary"
                  @click="emailRelatedGirl(relatedGirl)"
                />
                <Button
                  v-tooltip.bottom="{ value: 'Edit', showDelay: 500 }"
                  aria-label="Edit"
                  icon="pi pi-pencil"
                  size="small"
                  variant="outlined"
                  severity="success"
                  @click="editRelatedGirl(relatedGirl)"
                />
                <Button
                  v-tooltip.bottom="{ value: 'View Details', showDelay: 500 }"
                  aria-label="View Details"
                  icon="pi pi-info-circle"
                  size="small"
                  variant="outlined"
                  severity="secondary"
                  @click="openRelatedGirlDialog(relatedGirl)"
                />
              </div>
            </div>
          </div>
        </div>
        <Message
          v-if="hasMissingForms(adult)"
          severity="warn"
          icon="pi pi-exclamation-triangle"
          class="mb-2"
          :closable="true"
          >Missing Forms: {{ getMissingFormNames(adult) }}</Message
        >
        <!--<span v-if="girl.forms">{{ getFormNames(girl.forms) }}</span>-->
      </div>
    </div>

    <Dialog
      v-model:visible="relatedGirlDialog"
      :style="{ width: '450px' }"
      :header="
        selectedRelatedGirl
          ? getGirlDisplayName(selectedRelatedGirl)
          : 'Girl Details'
      "
      :modal="true"
    >
      <div v-if="selectedRelatedGirl" class="flex flex-col gap-3">
        <div>
          <span class="font-semibold">Email:</span>
          <a
            v-if="selectedRelatedGirl.email"
            class="ml-2 text-primary hover:underline"
            :href="`mailto:${selectedRelatedGirl.email}`"
          >
            {{ selectedRelatedGirl.email }}
          </a>
          <span v-else class="ml-2">—</span>
        </div>
        <div>
          <span class="font-semibold">Phone:</span>
          <a
            v-if="selectedRelatedGirl.phone"
            class="ml-2 text-primary hover:underline"
            :href="`tel:${selectedRelatedGirl.phone}`"
          >
            {{ selectedRelatedGirl.phone }}
          </a>
          <span v-else class="ml-2">—</span>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          text
          @click="hideRelatedGirlDialog"
        />
        <Button
          label="Edit"
          icon="pi pi-pencil"
          @click="editRelatedGirl(selectedRelatedGirl)"
        />
      </template>
    </Dialog>

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
        <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
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
</template>
