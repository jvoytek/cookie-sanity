<script setup lang="ts">
  const seasonsStore = useSeasonsStore();
  const notificationHelpers = useNotificationHelpers();

  const publishGirlRequestForm = computed({
    get: () => seasonsStore.currentSeason?.publish_girl_request_form ?? false,
    set: async (value) => {
      if (seasonsStore.currentSeason?.id) {
        try {
          await seasonsStore.upsertSeason({
            ...seasonsStore.currentSeason,
            publish_girl_request_form: value,
          });
          // Update local state
          if (seasonsStore.currentSeason) {
            seasonsStore.currentSeason.publish_girl_request_form = value;
          }
          await seasonsStore.fetchSeasons();
        } catch (error) {
          notificationHelpers.addError(error as Error);
        }
      }
    },
  });
</script>

<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12">
      <div class="card">
        <div class="flex items-center gap-4 mb-4">
          <ToggleSwitch
            v-model="publishGirlRequestForm"
            input-id="publish-girl-request-form"
          />
          <label for="publish-girl-request-form" class="font-bold"
            >Publish Girl Request Form</label
          >
        </div>
      </div>
    </div>
    <GirlList />
  </div>
</template>
