<script setup lang="ts">
  import { FilterMatchMode } from '@primevue/core/api';
  import { useFormKitNodeById } from '@formkit/vue';
  import { formatPersonDisplayName } from '@/shared/utils/personDisplay';
  import type { Girl } from '@/types/types';

  const notificationHelpers = useNotificationHelpers();
  const programLevelDisplay = useProgramLevelDisplay();

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

  const girlsStore = useGirlsStore();
  const adultsStore = useAdultsStore();
  const formsStore = useFormsStore();
  const eventsStore = useEventsStore();
  const seasonsStore = useSeasonsStore();
  const router = useRouter();
  const route = useRoute();
  const mobileContact = useMobileContact();

  loading.value = false;

  const toast = useToast();
  const girlDialog = ref(false);
  const deleteGirlDialog = ref(false);
  const relatedAdultDialog = ref(false);
  const selectedRelatedAdult = ref(null);
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

  const adultsBySellerId = computed(() => {
    const bySeller = {};
    adultsStore.allAdults.forEach((adult) => {
      (adult.sellers ?? []).forEach((sellerId) => {
        if (!bySeller[sellerId]) {
          bySeller[sellerId] = [];
        }
        bySeller[sellerId].push(adult);
      });
    });
    return bySeller;
  });

  const getAdultsForGirl = (girlId) => {
    return adultsBySellerId.value[girlId] ?? [];
  };

  const getFormNames = (formIds) => {
    return formIds
      .map((id) => formsStore.allForms.find((form) => form.id === id))
      .filter(Boolean)
      .map((form) => form.name)
      .join(', ');
  };

  const hasMissingForms = (girl) => {
    const requiredEventFormIds = eventsStore.getRequiredFormsForEventsForGirl(
      girl.id,
    );
    const requiredGirlFormIds = formsStore.requiredGirlForms.map((f) => f.id);
    const allRequiredFormIds = [
      ...requiredEventFormIds,
      ...requiredGirlFormIds,
    ];
    return !allRequiredFormIds.every((formId) => girl.forms.includes(formId));
  };

  const getMissingFormNames = (girl) => {
    const requiredEventFormIds = eventsStore.getRequiredFormsForEventsForGirl(
      girl.id,
    );
    const requiredGirlFormIds = formsStore.requiredGirlForms.map((f) => f.id);
    const allRequiredFormIds = [
      ...requiredEventFormIds,
      ...requiredGirlFormIds,
    ];
    const missingFormIds = allRequiredFormIds.filter(
      (formId) => !girl.forms.includes(formId),
    );
    return getFormNames(missingFormIds);
  };

  function openRelatedAdultDialog(adult) {
    selectedRelatedAdult.value = adult;
    relatedAdultDialog.value = true;
  }

  function hideRelatedAdultDialog() {
    relatedAdultDialog.value = false;
    selectedRelatedAdult.value = null;
  }

  function editRelatedAdult(adult) {
    hideRelatedAdultDialog();
    const path =
      route.path === '/troop-sanity/girls' ? '/troop-sanity/adults' : '/adults';
    router.push({
      path: path,
      query: { adult: adult.id.toString() },
    });
  }

  const getGirlIdFromQuery = () => {
    const rawGirlId = route.query?.girl;
    const first = Array.isArray(rawGirlId) ? rawGirlId[0] : rawGirlId;
    if (typeof first !== 'string') return null;
    const parsed = parseInt(first, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const openGirlFromQuery = async () => {
    const girlId = getGirlIdFromQuery();
    if (girlId === null) return;

    const relatedGirl = girlsStore.allGirls.find((g) => g.id === girlId);
    if (!relatedGirl) return;

    editGirl(relatedGirl);
    const query = { ...route.query };
    delete query.girl;
    await router.replace({ query });
  };

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

  const girlDialogFormSchema = computed(() => [
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
      name: 'pronouns',
      label: 'Pronouns',
      key: 'pronouns',
      placeholder: 'Enter pronouns (optional)',
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
      $formkit: 'primeSelect',
      name: 'program_level',
      label: 'Program Level',
      key: 'program_level',
      options: programLevelDisplay.programLevelOptions,
      'option-label': 'label',
      'option-value': 'value',
      placeholder: 'Select program level',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeMultiSelect',
      name: 'forms',
      options: formsStore.girlFormOptions,
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
  ]);

  const formNode = useFormKitNodeById('girl-form');

  const submitHandler = () => {
    saveGirl();
  };

  const submitButtonClickHandler = () => {
    if (formNode.value) formNode.value.submit();
  };

  const moreActions = (girl: Girl) => [
    {
      label: 'Edit Girl',
      icon: 'pi pi-pencil',
      command: () => editGirl(girl),
    },
    {
      label: 'Delete Girl',
      icon: 'pi pi-trash',
      command: () => confirmDeleteGirl(girl),
    },
  ];

  const menuRefs = ref({});

  const setMenuRef = (el, id) => {
    if (el) menuRefs.value[id] = el;
  };

  const toggleMenu = (event, itemId) => {
    menuRefs.value[itemId].toggle(event);
  };

  watch(
    () => [route.query.girl, girlsStore.allGirls.length],
    () => {
      openGirlFromQuery();
    },
    { immediate: true },
  );
</script>

<template>
  <div class="col-span-12">
    <div class="card">
      <h5>Girls</h5>

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
            <Button
              v-if="hasOtherSeasons"
              label="Copy from previous season"
              icon="pi pi-copy"
              severity="secondary"
              variant="outlined"
              @click="openCopyFromSeason"
            />
            <div
              class="flex items-center ml-6"
              v-if="$route.path !== '/troop-sanity/girls'"
            >
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

        <div class="hidden lg:block">
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

            <Column header="Name" sortable sort-field="first_name">
              <template #body="slotProps">
                {{ formatPersonDisplayName(slotProps.data) }}
              </template>
            </Column>
            <Column field="preferred_name" header="Preferred Name" sortable />
            <Column header="Program Level" sortable sort-field="program_level">
              <template #body="slotProps">
                {{
                  programLevelDisplay.getProgramLevelLabel(
                    slotProps.data.program_level,
                  )
                }}
              </template>
            </Column>
            <Column field="email" header="Email" sortable />
            <Column header="Related Adults">
              <template #body="slotProps">
                <div
                  v-if="getAdultsForGirl(slotProps.data.id).length > 0"
                  class="flex flex-wrap gap-2"
                >
                  <span
                    v-for="relatedAdult in getAdultsForGirl(slotProps.data.id)"
                    :key="relatedAdult.id"
                    ><Button
                      variant="outlined"
                      severity="info"
                      size="small"
                      @click="openRelatedAdultDialog(relatedAdult)"
                    >
                      {{
                        formatPersonDisplayName(relatedAdult, {
                          usePreferredName: true,
                        })
                      }}
                    </Button></span
                  >
                </div>
                <span v-else>—</span>
              </template>
            </Column>
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
      </div>
    </div>
    <div class="block lg:hidden">
      <div class="card" v-for="girl in girlsStore.allGirls" :key="girl.id">
        <div class="flex justify-between items-center mb-2">
          <div>
            <div class="font-bold flex justify-between items-center">
              <ProgramLevelBadge :programLevel="girl.program_level" />{{
                formatPersonDisplayName(girl, { usePreferredName: true })
              }}
            </div>
          </div>
          <div class="flex gap-2">
            <Button
              v-if="girl.phone"
              aria-label="Call"
              icon="pi pi-phone"
              size="small"
              @click="mobileContact.callNumber(girl.phone)"
            />
            <Button
              v-if="girl.phone"
              v-tooltip.bottom="{ value: 'Text', showDelay: 500 }"
              aria-label="Text"
              icon="pi pi-comment"
              size="small"
              severity="info"
              @click="mobileContact.textNumber(girl.phone)"
            />
            <Button
              v-if="girl.email"
              v-tooltip.bottom="{ value: 'Email', showDelay: 500 }"
              aria-label="Email"
              icon="pi pi-envelope"
              size="small"
              severity="secondary"
              @click="mobileContact.emailAddress(girl.email)"
            />
            <Button
              type="button"
              icon="pi pi-ellipsis-v"
              outlined
              severity="secondary"
              @click="toggleMenu($event, girl.id)"
              aria-haspopup="true"
              :aria-controls="'overlay_menu_' + girl.id"
            />
            <Menu
              :ref="(el) => setMenuRef(el, girl.id)"
              :id="'overlay_menu_' + girl.id"
              :model="moreActions(girl)"
              :popup="true"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div v-if="getAdultsForGirl(girl.id).length > 0">
            <div
              class="border border-gray-200 flex justify-between items-center p-2 rounded-md mb-1"
              v-for="relatedAdult in getAdultsForGirl(girl.id)"
              :key="relatedAdult.id"
            >
              <span>
                {{
                  formatPersonDisplayName(relatedAdult, {
                    usePreferredName: true,
                  })
                }}
              </span>
              <div class="flex gap-2">
                <Button
                  v-if="relatedAdult.phone"
                  aria-label="Call"
                  icon="pi pi-phone"
                  label="Call"
                  size="small"
                  @click="mobileContact.callNumber(relatedAdult.phone)"
                />
                <Button
                  v-if="relatedAdult.phone"
                  v-tooltip.bottom="{ value: 'Text', showDelay: 500 }"
                  aria-label="Text"
                  icon="pi pi-comment"
                  size="small"
                  severity="info"
                  @click="mobileContact.textNumber(relatedAdult.phone)"
                />
                <Button
                  v-if="relatedAdult.email"
                  v-tooltip.bottom="{ value: 'Email', showDelay: 500 }"
                  aria-label="Email"
                  icon="pi pi-envelope"
                  size="small"
                  severity="secondary"
                  @click="mobileContact.emailAddress(relatedAdult.email)"
                />
                <Button
                  v-tooltip.bottom="{ value: 'Edit', showDelay: 500 }"
                  aria-label="Edit"
                  icon="pi pi-pencil"
                  size="small"
                  variant="outlined"
                  severity="success"
                  @click="editRelatedAdult(relatedAdult)"
                />
                <Button
                  v-tooltip.bottom="{ value: 'View Details', showDelay: 500 }"
                  aria-label="View Details"
                  icon="pi pi-info-circle"
                  size="small"
                  variant="outlined"
                  severity="secondary"
                  @click="openRelatedAdultDialog(relatedAdult)"
                />
              </div>
            </div>
          </div>
        </div>
        <Message
          v-if="hasMissingForms(girl)"
          severity="warn"
          icon="pi pi-exclamation-triangle"
          class="mb-2"
          :closable="true"
          >Missing Forms: {{ getMissingFormNames(girl) }}</Message
        >
        <!--<span v-if="girl.forms">{{ getFormNames(girl.forms) }}</span>-->
      </div>
    </div>

    <Dialog
      v-model:visible="relatedAdultDialog"
      :style="{ width: '450px' }"
      :header="
        selectedRelatedAdult
          ? formatPersonDisplayName(selectedRelatedAdult, {
              usePreferredName: true,
            })
          : 'Adult Details'
      "
      :modal="true"
    >
      <div v-if="selectedRelatedAdult" class="flex flex-col gap-3">
        <div>
          <span class="font-semibold">Email:</span>
          <a
            v-if="selectedRelatedAdult.email"
            class="ml-2 text-primary hover:underline"
            :href="`mailto:${selectedRelatedAdult.email}`"
          >
            {{ selectedRelatedAdult.email }}
          </a>
          <span v-else class="ml-2">—</span>
        </div>
        <div>
          <span class="font-semibold">Phone:</span>
          <a
            v-if="selectedRelatedAdult.phone"
            class="ml-2 text-primary hover:underline"
            :href="`tel:${selectedRelatedAdult.phone}`"
          >
            {{ selectedRelatedAdult.phone }}
          </a>
          <span v-else class="ml-2">—</span>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          text
          @click="hideRelatedAdultDialog"
        />
        <Button
          label="Edit"
          icon="pi pi-pencil"
          @click="editRelatedAdult(selectedRelatedAdult)"
        />
      </template>
    </Dialog>

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
        <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
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
</template>
