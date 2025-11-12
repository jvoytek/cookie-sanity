<script setup lang="ts">
  import { useFormKitNodeById } from '@formkit/vue';

  const seasonsStore = useSeasonsStore();
  const formNode = useFormKitNodeById('season-form');

  const submitButtonClickHandler = () => {
    if (formNode.value) formNode.value.submit();
  };

  const handleAfterHide = () => {
    seasonsStore.cancelEditSeason();
  };

  async function saveSeason() {
    if (seasonsStore.activeSeason?.id) {
      seasonsStore.upsertSeason(seasonsStore.activeSeason);
    } else if (seasonsStore.activeSeason) {
      seasonsStore.insertSeason(seasonsStore.activeSeason);
    }

    seasonsStore.seasonDialogVisible = false;
    seasonsStore.activeSeason = null;
  }

  const seasonDialogFormSchema = [
    {
      $formkit: 'primeInputText',
      name: 'troop_number',
      label: 'Troop Number',
      validation: 'required',
      placeholder: 'Enter Troop Number',
    },
    {
      $formkit: 'primeInputText',
      name: 'year',
      label: 'Year',
      validation: 'required|integer|min:1900|max:2100',
      placeholder: 'Enter the Year (e.g., 2024)',
    },
  ];
</script>
<template>
  <Dialog
    v-model:visible="seasonsStore.seasonDialogVisible"
    :style="{ width: '450px' }"
    header="Season Details"
    :modal="true"
    @after-hide="handleAfterHide"
  >
    <div class="flex flex-col gap-6">
      <FormKit
        id="season-form"
        v-model="seasonsStore.activeSeason"
        type="form"
        :actions="false"
        @submit="saveSeason"
      >
        <!-- Render the dynamic form using the schema -->
        <FormKitSchema :schema="seasonDialogFormSchema" />
      </FormKit>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        text
        @click="seasonsStore.hideDialog"
      />
      <Button
        label="Save"
        icon="pi pi-check"
        @click="submitButtonClickHandler"
      />
    </template>
  </Dialog>
</template>
