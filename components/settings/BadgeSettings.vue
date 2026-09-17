<script setup lang="ts">
  import { FilterMatchMode } from '@primevue/core/api';
  import { useFormKitNodeById } from '@formkit/vue';
  import type { Database } from '@/types/supabase';
  import type { Badge, Girl } from '@/types/types';

  const { isMobile } = useDevice();

  const badgesStore = useBadgesStore();
  const seasonsStore = useSeasonsStore();
  const girlsStore = useGirlsStore();
  const notificationHelpers = useNotificationHelpers();
  const supabaseClient = useSupabaseClient<Database>();

  const badgeDialogVisible = ref(false);
  const deleteBadgeDialogVisible = ref(false);
  const badge = ref<Record<string, unknown>>({});
  const submitted = ref(false);
  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const programLevelOptions = [
    { label: 'Daisy', value: 'daisy' },
    { label: 'Brownie', value: 'brownie' },
    { label: 'Junior', value: 'junior' },
    { label: 'Cadette', value: 'cadette' },
    { label: 'Senior', value: 'senior' },
    { label: 'Ambassador', value: 'ambassador' },
  ];

  function openNew() {
    badge.value = {
      season: seasonsStore.currentSeason?.id,
      program_level: 'daisy',
    };
    submitted.value = false;
    badgeDialogVisible.value = true;
  }

  function hideDialog() {
    badgeDialogVisible.value = false;
    submitted.value = false;
  }

  async function saveBadge() {
    submitted.value = true;
    if (badge.value.name && badge.value.program_level) {
      if (badge.value.id) {
        badge.value = ((await badgesStore.upsertBadge(badge.value as Badge)) ??
          badge.value) as Record<string, unknown>;
      } else {
        badge.value = ((await badgesStore.insertBadge(
          badge.value as Omit<Badge, 'id' | 'created_at' | 'updated_at'>,
        )) ?? badge.value) as Record<string, unknown>;
      }
    }
  }

  function editBadge(selectedBadge: Record<string, unknown>) {
    badge.value = { ...selectedBadge };
    badgeDialogVisible.value = true;
  }

  function confirmDeleteBadge(selectedBadge: Record<string, unknown>) {
    badge.value = selectedBadge;
    deleteBadgeDialogVisible.value = true;
  }

  async function deleteBadge() {
    await badgesStore.deleteBadge(badge.value as Badge);
    deleteBadgeDialogVisible.value = false;
    badgeDialogVisible.value = false;
    badge.value = {};
  }

  function getProgramLevelLabel(programLevel: string) {
    return (
      programLevelOptions.find((option) => option.value === programLevel)
        ?.label ?? programLevel
    );
  }

  function badgeCountForField(
    field: 'badges_earned' | 'badges_received',
    badgeId: number,
  ) {
    return girlsStore.allGirls.filter((girl) =>
      (girl[field] ?? []).includes(badgeId),
    ).length;
  }

  function girlHasBadge(
    girl: Girl,
    field: 'badges_earned' | 'badges_received',
    badgeId: number,
  ) {
    return (girl[field] ?? []).includes(badgeId);
  }

  async function toggleGirlBadge(
    girl: Girl,
    field: 'badges_earned' | 'badges_received',
    badgeId: number,
  ) {
    const girlIndex = girlsStore.allGirls.findIndex((g) => g.id === girl.id);
    if (girlIndex === -1) return;

    const currentBadgeIds = [...(girlsStore.allGirls[girlIndex][field] ?? [])];
    const updatedBadgeIds = currentBadgeIds.includes(badgeId)
      ? currentBadgeIds.filter((id) => id !== badgeId)
      : [...currentBadgeIds, badgeId];

    try {
      const { error } = await supabaseClient
        .from('sellers')
        .update({ [field]: updatedBadgeIds })
        .eq('id', girl.id);
      if (error) throw error;
      girlsStore.allGirls[girlIndex][field] = updatedBadgeIds;
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  }

  const badgeDialogFormSchema = [
    {
      $formkit: 'primeInputText',
      name: 'name',
      label: 'Name',
      key: 'name',
      placeholder: 'Enter badge name',
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
      placeholder: 'Enter badge URL (optional)',
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
      options: programLevelOptions,
      'option-label': 'label',
      'option-value': 'value',
      placeholder: 'Select program level',
      validation: 'required',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
  ];

  const badgeNode = useFormKitNodeById('badge-settings-form');

  const submitHandler = () => {
    saveBadge();
  };

  const submitButtonClickHandler = () => {
    if (badgeNode.value) badgeNode.value.submit();
  };
</script>

<template>
  <div class="col-span-12">
    <div class="card">
      <h5>Badges</h5>
      <p>
        Manage badges for the current season and track which girls have earned
        and received them.
      </p>

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

      <ClientOnly>
        <DataTable
          v-if="!isMobile"
          :value="badgesStore.allBadges"
          data-key="id"
          :filters="filters"
          sort-field="program_level"
        >
          <template #header>
            <div class="flex flex-wrap gap-2 items-center justify-between">
              <h4 class="m-0">Manage Badges</h4>
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
          <Column field="program_level" header="Program Level" sortable>
            <template #body="slotProps">
              {{ getProgramLevelLabel(slotProps.data.program_level) }}
            </template>
          </Column>
          <Column field="url" header="URL">
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
          <Column header="Earned">
            <template #body="slotProps">
              {{
                badgeCountForField('badges_earned', slotProps.data.id) || '—'
              }}
            </template>
          </Column>
          <Column header="Received">
            <template #body="slotProps">
              {{
                badgeCountForField('badges_received', slotProps.data.id) || '—'
              }}
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
                @click="editBadge(slotProps.data)"
              />
              <Button
                v-tooltip.bottom="{ value: 'Delete', showDelay: 500 }"
                aria-label="Delete"
                icon="pi pi-trash"
                class="mr-2"
                variant="outlined"
                severity="warn"
                @click="confirmDeleteBadge(slotProps.data)"
              />
            </template>
          </Column>
        </DataTable>
      </ClientOnly>
    </div>

    <ClientOnly>
      <DataView
        v-if="isMobile"
        :value="badgesStore.allBadges"
        layout="list"
        :pt="{ content: { class: 'bg-transparent! mb-2' } }"
      >
        <template #empty>
          <div class="text-center py-8 card">
            <p class="text-surface-500 dark:text-surface-400">
              No badges have been added yet.
            </p>
          </div>
        </template>
        <template #list="slotProps">
          <div class="flex flex-col">
            <div
              v-for="currentBadge in slotProps.items"
              :key="currentBadge.id"
              class="pt-2 pb-2 card"
            >
              <div class="flex justify-between items-start gap-3">
                <div class="min-w-0">
                  <div class="font-bold">{{ currentBadge.name }}</div>
                  <div>
                    {{ getProgramLevelLabel(currentBadge.program_level) }}
                  </div>
                  <a
                    v-if="currentBadge.url"
                    :href="currentBadge.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary hover:underline break-all"
                  >
                    {{ currentBadge.url }}
                  </a>
                  <div>
                    Earned:
                    {{ badgeCountForField('badges_earned', currentBadge.id) }}
                  </div>
                  <div>
                    Received:
                    {{ badgeCountForField('badges_received', currentBadge.id) }}
                  </div>
                </div>
                <div class="flex gap-2">
                  <Button
                    aria-label="Edit"
                    icon="pi pi-pencil"
                    outlined
                    severity="secondary"
                    @click="editBadge(currentBadge)"
                  />
                  <Button
                    aria-label="Delete"
                    icon="pi pi-trash"
                    outlined
                    severity="warn"
                    @click="confirmDeleteBadge(currentBadge)"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </DataView>
    </ClientOnly>

    <Dialog
      v-model:visible="badgeDialogVisible"
      :style="{ width: '900px' }"
      header="Badge Details"
      :modal="true"
    >
      <div class="flex flex-col gap-6">
        <FormKit
          id="badge-settings-form"
          v-model="badge"
          type="form"
          :actions="false"
          @submit="submitHandler"
        >
          <FormKitSchema :schema="badgeDialogFormSchema" />
        </FormKit>

        <div v-if="badge.id">
          <h6 class="mb-3">Girls in this Season</h6>
          <ClientOnly>
            <DataTable v-if="!isMobile" :value="girlsStore.allGirls" data-key="id">
              <Column header="Girl">
                <template #body="slotProps">
                  {{ girlsStore.getGirlNameById(slotProps.data.id) }}
                </template>
              </Column>
              <Column header="Earned">
                <template #body="slotProps">
                  <Checkbox
                    :model-value="
                      girlHasBadge(slotProps.data, 'badges_earned', badge.id)
                    "
                    :binary="true"
                    @update:model-value="
                      toggleGirlBadge(slotProps.data, 'badges_earned', badge.id)
                    "
                  />
                </template>
              </Column>
              <Column header="Received">
                <template #body="slotProps">
                  <Checkbox
                    :model-value="
                      girlHasBadge(slotProps.data, 'badges_received', badge.id)
                    "
                    :binary="true"
                    @update:model-value="
                      toggleGirlBadge(
                        slotProps.data,
                        'badges_received',
                        badge.id,
                      )
                    "
                  />
                </template>
              </Column>
            </DataTable>
          </ClientOnly>

          <ClientOnly>
            <DataView
              v-if="isMobile"
              :value="girlsStore.allGirls"
              layout="list"
              :pt="{ content: { class: 'bg-transparent! mb-2' } }"
            >
              <template #empty>
                <div class="text-center py-4 card">
                  <p class="text-surface-500 dark:text-surface-400">
                    No girls have been added to this season yet.
                  </p>
                </div>
              </template>
              <template #list="slotProps">
                <div class="flex flex-col">
                  <div
                    v-for="girl in slotProps.items"
                    :key="girl.id"
                    class="pt-2 pb-2 card"
                  >
                    <div class="font-bold mb-2">
                      {{ girlsStore.getGirlNameById(girl.id) }}
                    </div>
                    <div class="flex items-center justify-between mb-2">
                      <span>Earned</span>
                      <Checkbox
                        :model-value="
                          girlHasBadge(girl, 'badges_earned', badge.id)
                        "
                        :binary="true"
                        @update:model-value="
                          toggleGirlBadge(girl, 'badges_earned', badge.id)
                        "
                      />
                    </div>
                    <div class="flex items-center justify-between">
                      <span>Received</span>
                      <Checkbox
                        :model-value="
                          girlHasBadge(girl, 'badges_received', badge.id)
                        "
                        :binary="true"
                        @update:model-value="
                          toggleGirlBadge(girl, 'badges_received', badge.id)
                        "
                      />
                    </div>
                  </div>
                </div>
              </template>
            </DataView>
          </ClientOnly>
        </div>

        <Message v-else severity="info" variant="simple">
          Save the badge to start tracking which girls have earned and received
          it.
        </Message>
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
      v-model:visible="deleteBadgeDialogVisible"
      :style="{ width: '450px' }"
      header="Confirm"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span v-if="badge"
          >Are you sure you want to delete <b>{{ badge.name }}</b
          >?</span
        >
      </div>
      <template #footer>
        <Button
          label="No"
          icon="pi pi-times"
          text
          @click="deleteBadgeDialogVisible = false"
        />
        <Button label="Yes" icon="pi pi-check" @click="deleteBadge" />
      </template>
    </Dialog>
  </div>
</template>
