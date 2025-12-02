<script setup>
  const seasonsStore = useSeasonsStore();
  const notificationHelpers = useNotificationHelpers();

  const publishGirlRequestForm = ref(false);
  const girlRequestFormPassword = ref('');

  // Load current season settings when component mounts
  onMounted(() => {
    if (seasonsStore.currentSeason) {
      publishGirlRequestForm.value =
        seasonsStore.currentSeason.publish_girl_request_form || false;
      girlRequestFormPassword.value =
        seasonsStore.currentSeason.girl_request_form_password || '';
    }
  });

  // Watch for changes in current season
  watch(
    () => seasonsStore.currentSeason,
    (newSeason) => {
      if (newSeason) {
        publishGirlRequestForm.value =
          newSeason.publish_girl_request_form || false;
        girlRequestFormPassword.value =
          newSeason.girl_request_form_password || '';
      }
    },
    { deep: true },
  );

  async function saveSettings() {
    if (!seasonsStore.currentSeason) {
      notificationHelpers.addError({
        message: 'No current season selected',
      });
      return;
    }

    try {
      const updatedSeason = {
        ...seasonsStore.currentSeason,
        publish_girl_request_form: publishGirlRequestForm.value,
        girl_request_form_password: girlRequestFormPassword.value || null,
      };

      await seasonsStore.upsertSeason(updatedSeason);

      // Update the current season in the store
      seasonsStore.currentSeason = updatedSeason;

      notificationHelpers.addSuccess('Girl Request Form settings saved');
    } catch (error) {
      notificationHelpers.addError(error);
    }
  }
</script>

<template>
  <div class="col-span-12">
    <div class="card">
      <h5>Girl Request Form</h5>
      <p class="mb-4 text-sm text-surface-500">
        Control access to the public form where girls can request cookies.
      </p>

      <div class="flex flex-col gap-4">
        <div class="field">
          <div class="flex items-center gap-3">
            <ToggleSwitch
              v-model="publishGirlRequestForm"
              input-id="publish-toggle"
            />
            <label for="publish-toggle" class="font-medium">
              Publish Girl Request Form
            </label>
          </div>
          <small class="text-surface-500">
            When enabled, girls can access the request form at
            <span class="font-mono">/girl-request</span>
          </small>
        </div>

        <div class="field">
          <label for="request-password" class="font-medium block mb-2">
            Request Form Password (Optional)
          </label>
          <InputText
            id="request-password"
            v-model="girlRequestFormPassword"
            type="password"
            class="w-full"
            placeholder="Enter a password to protect the form"
          />
          <small class="text-surface-500">
            Leave blank to allow access without a password
          </small>
        </div>

        <div class="flex justify-end">
          <Button
            label="Save Settings"
            icon="pi pi-check"
            @click="saveSettings"
          />
        </div>
      </div>
    </div>
  </div>
</template>
