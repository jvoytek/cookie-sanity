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
  const permissionsDialogVisible = ref(false);

  // Fetch collaborators when component mounts
  onMounted(async () => {
    await collaboratorsStore.fetchCollaborators();
    await collaboratorsStore.fetchSellerPermissions();
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

  const openPermissionsDialog = (collaborator: SeasonCollaborator) => {
    selectedCollaborator.value = collaborator;
    permissionsDialogVisible.value = true;
  };

  const getPermissionLabel = (level: string) => {
    const labels: Record<string, string> = {
      none: 'None',
      view: 'View Only',
      request: 'Request',
      edit: 'Full Edit',
    };
    return labels[level] || level;
  };
</script>

<template>
  <div>
    <div class="col-span-12">
      <div class="card">
        <h5>Collaborators</h5>
        <p class="text-surface-500 dark:text-surface-400 mb-6">
          Invite others to help manage this season. You can set permissions for
          each girl individually.
        </p>

        <div v-if="!seasonsStore.isCurrentSeasonOwner()">
          <Message severity="info"
            >You are a collaborator on this season and cannot manage other
            collaborators.</Message
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
                <span>{{ (slotProps.data as any).profiles?.display_name || slotProps.data.profile_id }}</span>
              </template>
            </Column>
            <Column field="can_view_booths" header="Booths">
              <template #body="slotProps">
                <Tag
                  v-if="slotProps.data.can_edit_booths"
                  severity="success"
                  value="Edit"
                />
                <Tag
                  v-else-if="slotProps.data.can_view_booths"
                  severity="info"
                  value="View"
                />
                <Tag v-else severity="secondary" value="None" />
              </template>
            </Column>
            <Column field="can_view_inventory_checks" header="Inventory Checks">
              <template #body="slotProps">
                <Tag
                  v-if="slotProps.data.can_edit_inventory_checks"
                  severity="success"
                  value="Edit"
                />
                <Tag
                  v-else-if="slotProps.data.can_view_inventory_checks"
                  severity="info"
                  value="View"
                />
                <Tag v-else severity="secondary" value="None" />
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
                  v-tooltip.bottom="{ value: 'Manage Permissions', showDelay: 500 }"
                  icon="pi pi-lock"
                  class="mr-2"
                  variant="outlined"
                  severity="secondary"
                  @click="openPermissionsDialog(slotProps.data)"
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

        <div>
          <h6 class="mb-2">Booth Sales Permissions</h6>
          <div class="flex items-center gap-2 mb-2">
            <Checkbox
              v-model="newCollaboratorPermissions.can_view_booths"
              binary
              input-id="view-booths"
            />
            <label for="view-booths">Can view booth sales</label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox
              v-model="newCollaboratorPermissions.can_edit_booths"
              binary
              input-id="edit-booths"
            />
            <label for="edit-booths">Can edit booth sales</label>
          </div>
        </div>

        <div>
          <h6 class="mb-2">Inventory Check Permissions</h6>
          <div class="flex items-center gap-2 mb-2">
            <Checkbox
              v-model="newCollaboratorPermissions.can_view_inventory_checks"
              binary
              input-id="view-inventory"
            />
            <label for="view-inventory">Can view inventory checks</label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox
              v-model="newCollaboratorPermissions.can_edit_inventory_checks"
              binary
              input-id="edit-inventory"
            />
            <label for="edit-inventory">Can edit inventory checks</label>
          </div>
        </div>

        <Message severity="info" :closable="false"
          >Girl-specific permissions can be set after inviting the
          collaborator.</Message
        >
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

    <!-- Permissions Management Dialog -->
    <Dialog
      v-model:visible="permissionsDialogVisible"
      :style="{ width: '600px' }"
      header="Manage Girl Permissions"
      :modal="true"
    >
      <div v-if="selectedCollaborator" class="flex flex-col gap-4">
        <p class="text-surface-500 dark:text-surface-400">
          Set permissions for each girl. Collaborators can only see girls they
          have permissions for.
        </p>

        <div class="flex flex-col gap-3">
          <div
            v-for="girl in girlsStore.allGirls"
            :key="girl.id"
            class="flex items-center justify-between p-3 border border-surface-200 dark:border-surface-700 rounded"
          >
            <span class="font-semibold"
              >{{ girl.first_name }} {{ girl.last_name }}</span
            >
            <SelectButton
              :model-value="
                collaboratorsStore.getSellerPermission(
                  selectedCollaborator.id,
                  girl.id,
                )
              "
              :options="['none', 'view', 'request', 'edit']"
              @update:model-value="
                (value) =>
                  collaboratorsStore.setSellerPermission(
                    selectedCollaborator.id,
                    girl.id,
                    value,
                  )
              "
            >
              <template #option="slotProps">
                {{ getPermissionLabel(slotProps.option) }}
              </template>
            </SelectButton>
          </div>
        </div>
      </div>
      <template #footer>
        <Button
          label="Close"
          icon="pi pi-times"
          @click="permissionsDialogVisible = false"
        />
      </template>
    </Dialog>
  </div>
</template>
