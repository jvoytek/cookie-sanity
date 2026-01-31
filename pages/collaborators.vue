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
  const editDialogVisible = ref(false);
  const selectedCollaborator = ref<SeasonCollaborator | null>(null);
  const editAllAccess = ref(true);
  const editChildren = ref<number[]>([]);

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

  const openEditDialog = (collaborator: SeasonCollaborator) => {
    selectedCollaborator.value = collaborator;
    editAllAccess.value = collaborator.all_access;
    editChildren.value = collaborator.children
      ? [...collaborator.children]
      : [];
    editDialogVisible.value = true;
  };

  const saveCollaborator = async () => {
    if (!selectedCollaborator.value) return;

    await collaboratorsStore.updateCollaborator(
      selectedCollaborator.value.id,
      {
        can_view_booths: selectedCollaborator.value.can_view_booths,
        can_edit_booths: selectedCollaborator.value.can_edit_booths,
        can_view_inventory_checks:
          selectedCollaborator.value.can_view_inventory_checks,
        can_edit_inventory_checks:
          selectedCollaborator.value.can_edit_inventory_checks,
      },
      editAllAccess.value,
      editChildren.value.length > 0 ? editChildren.value : null,
    );

    editDialogVisible.value = false;
    selectedCollaborator.value = null;
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

        <p>
          Invite others to help manage this season. Collaborators can view and
          edit the season just as you can using their own login, but only season
          owners can add/edit/delete other collaborators.
        </p>

        <p>
          To add a collaborator have them sign up and then share their Profile
          ID from their
          <a
            href="/settings"
            class="text-primary-500 no-underline hover:underline"
            >account settings</a
          >
          page.
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
            <Column field="profile_id">
              <template #header>
                <strong>Name/Profile ID</strong>
                <i
                  v-tooltip.bottom="{
                    value:
                      'The user\'s display name from their profile, or their Profile ID if no display name is set.',
                  }"
                  class="pi pi-info-circle ml-2 text-sm text-gray-500 cursor-pointer"
                />
              </template>
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
                  v-tooltip.bottom="{ value: 'Edit', showDelay: 500 }"
                  icon="pi pi-pencil"
                  variant="outlined"
                  severity="secondary"
                  class="mr-2"
                  @click="openEditDialog(slotProps.data)"
                />
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

    <!-- Edit Collaborator Dialog -->
    <Dialog
      v-model:visible="editDialogVisible"
      :style="{ width: '600px' }"
      header="Edit Collaborator"
      :modal="true"
    >
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <Checkbox
            v-model="editAllAccess"
            input-id="all_access"
            :binary="true"
          />
          <label for="all_access" class="font-semibold">Full Access</label>
          <i
            v-tooltip.right="{
              value:
                'Full access collaborators can view and edit all season data. Uncheck to create a parent account with limited access to specific girls.',
            }"
            class="pi pi-info-circle text-sm text-gray-500 cursor-pointer"
          />
        </div>

        <div v-if="!editAllAccess">
          <label class="block mb-2 font-semibold">Children (Girls)</label>
          <MultiSelect
            v-model="editChildren"
            :options="girlsStore.girlOptions"
            option-label="label"
            option-value="value"
            placeholder="Select girls"
            class="w-full"
            display="chip"
          />
          <small class="text-surface-500 dark:text-surface-400 mt-1 block"
            >Select which girls this parent can view. Parents can only see their
            assigned girls' dashboards and inventory.</small
          >
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          text
          @click="editDialogVisible = false"
        />
        <Button label="Save" icon="pi pi-check" @click="saveCollaborator" />
      </template>
    </Dialog>
  </div>
</template>
