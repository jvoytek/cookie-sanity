<script setup lang="ts">
  import type { SeasonCollaborator } from '@/types/types';

  const supabaseClient = useSupabaseClient();
  const collaboratorsStore = useCollaboratorsStore();
  const seasonsStore = useSeasonsStore();
  const girlsStore = useGirlsStore();
  const notificationHelpers = useNotificationHelpers();

  const newCollaboratorEmail = ref('');
  const newCollaboratorPermissions = ref({
    can_view_booths: false,
    can_edit_booths: false,
    can_view_inventory_checks: false,
    can_edit_inventory_checks: false,
  });
  const showInviteDialog = ref(false);
  const deleteDialogVisible = ref(false);
  const selectedCollaborator = ref<SeasonCollaborator | null>(null);

  // Fetch collaborators when component mounts
  onMounted(async () => {
    await collaboratorsStore.fetchCollaborators();
  });

  const openInviteDialog = () => {
    newCollaboratorEmail.value = '';
    newCollaboratorPermissions.value = {
      can_view_booths: false,
      can_edit_booths: false,
      can_view_inventory_checks: false,
      can_edit_inventory_checks: false,
    };
    showInviteDialog.value = true;
  };

  const inviteCollaborator = async () => {
    if (!newCollaboratorEmail.value || !seasonsStore.currentSeason?.id) {
      notificationHelpers.addError(
        new Error('Please provide a user identifier'),
      );
      return;
    }

    try {
      // Search for the profile by ID (profiles are public for viewing)
      // Users need to share their profile ID to be invited
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('id', newCollaboratorEmail.value)
        .single();

      if (profileError || !profileData) {
        notificationHelpers.addError(
          new Error('User not found. Please ensure the user ID is correct.'),
        );
        return;
      }

      await collaboratorsStore.addCollaborator(
        profileData.id,
        seasonsStore.currentSeason.id,
        newCollaboratorPermissions.value,
      );

      showInviteDialog.value = false;
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const confirmDeleteCollaborator = (collaborator: SeasonCollaborator) => {
    selectedCollaborator.value = collaborator;
    deleteDialogVisible.value = true;
  };

  const deleteCollaborator = async () => {
    if (!selectedCollaborator.value) return;
    await collaboratorsStore.deleteCollaborator(selectedCollaborator.value.id);
    deleteDialogVisible.value = false;
    selectedCollaborator.value = null;
  };
</script>

<template>
  <div>
    <div class="col-span-12">
      <div class="card">
        <h5>Collaborators</h5>
        <p class="text-surface-500 dark:text-surface-400 mb-6">
          Invite others to help manage this season.
        </p>

        <div v-if="!seasonsStore.isCurrentSeasonOwner()">
          <Message severity="secondary"
            >You are a collaborator on this season and cannot add/remove other
            collaborators. Contact the owner to manage collaborators.</Message
          >
        </div>

        <div v-else>
          <Toolbar class="mb-6">
            <template #start>
              <Button
                label="Invite Collaborator"
                icon="pi pi-user-plus"
                severity="secondary"
                @click="openInviteDialog"
              />
            </template>
          </Toolbar>

          <DataTable
            :value="collaboratorsStore.collaborators"
            data-key="id"
            :paginator="false"
          >
            <Column field="profile_id" header="Email">
              <template #body="slotProps">
                <span>{{
                  (slotProps.data as any).profiles?.display_name ||
                  slotProps.data.profile_id
                }}</span>
              </template>
            </Column>
            <Column field="created_at" header="Invited">
              <template #body="slotProps">
                {{ new Date(slotProps.data.created_at).toLocaleDateString() }}
              </template>
            </Column>
            <Column header="Actions">
              <template #body="slotProps">
                <Button
                  v-tooltip.bottom="{ value: 'Remove', showDelay: 500 }"
                  icon="pi pi-trash"
                  variant="outlined"
                  severity="danger"
                  @click="confirmDeleteCollaborator(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>

    <!-- Invite Collaborator Dialog -->
    <Dialog
      v-model:visible="showInviteDialog"
      :style="{ width: '450px' }"
      header="Invite Collaborator"
      :modal="true"
    >
      <div class="flex flex-col gap-4">
        <div>
          <label for="email" class="block mb-2 font-semibold"
            >User Profile ID</label
          >
          <InputText
            id="email"
            v-model="newCollaboratorEmail"
            class="w-full"
            placeholder="user-profile-id"
          />
          <small class="text-surface-500 dark:text-surface-400 mt-1 block"
            >The user must share their profile ID from their account settings.
            Users can find this in Settings > Account.</small
          >
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          text
          @click="showInviteDialog = false"
        />
        <Button label="Invite" icon="pi pi-check" @click="inviteCollaborator" />
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      :style="{ width: '450px' }"
      header="Confirm"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span
          >Are you sure you want to remove this collaborator? They will lose
          access to this season.</span
        >
      </div>
      <template #footer>
        <Button
          label="No"
          icon="pi pi-times"
          text
          @click="deleteDialogVisible = false"
        />
        <Button label="Yes" icon="pi pi-check" @click="deleteCollaborator" />
      </template>
    </Dialog>
  </div>
</template>
