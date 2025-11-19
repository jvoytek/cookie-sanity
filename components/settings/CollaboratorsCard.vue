<script setup>
  const router = useRouter();
  const seasonsStore = useSeasonsStore();

  function goToCollaborators() {
    router.push('/collaborators');
  }
</script>

<template>
  <div class="col-span-12 lg:col-span-6">
    <div class="card h-full">
      <h5>Collaborators</h5>
      <p class="text-surface-500 dark:text-surface-400 mb-4">
        Manage who can access and edit this season
      </p>

      <div v-if="seasonsStore.isCurrentSeasonOwner()">
        <Button
          label="Manage Collaborators"
          icon="pi pi-users"
          @click="goToCollaborators"
        />
      </div>
      <div v-else>
        <Message severity="info" :closable="false"
          >You are a collaborator on this season</Message
        >
      </div>
    </div>
  </div>
</template>
