<script setup lang="ts">
  import type { AuditSession } from '@/types/types';

  const auditSessionsStore = useAuditSessionsStore();
  const notificationHelpers = useNotificationHelpers();

  const showArchived = ref(false);
  const loading = ref(false);

  const loadSessions = async (): Promise<void> => {
    loading.value = true;
    try {
      console.log('loading sessions, showArchived=', showArchived.value);
      await auditSessionsStore.fetchAllAuditSessions(showArchived.value);
    } catch (error) {
      notificationHelpers.addError(
        new Error('Failed to load audit sessions', error as Error),
      );
    } finally {
      loading.value = false;
    }
  };

  const archiveSession = async (session: AuditSession): Promise<void> => {
    try {
      await auditSessionsStore.archiveAuditSession(session.id);
      notificationHelpers.addSuccess(
        `Audit session "${session.file_name}" archived successfully`,
      );
    } catch (error) {
      notificationHelpers.addError(
        new Error('Failed to archive audit session', error as Error),
      );
    }
  };

  const selectSession = async (session: AuditSession): Promise<void> => {
    auditSessionsStore.mostRecentAuditSession = session;
    await auditSessionsStore.fetchMatches();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusSeverity = (
    status: string,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' => {
    switch (status) {
      case 'complete':
        return 'success';
      case 'archived':
        return 'secondary';
      case 'pending':
        return 'info';
      default:
        return 'contrast';
    }
  };

  watch(showArchived, async () => {
    await loadSessions();
  });
</script>

<template>
  <div class="card">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">Audit Files</h2>
      <div class="flex items-center gap-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <Checkbox
            v-model="showArchived"
            :binary="true"
            input-id="show-archived"
          />
          <span class="text-sm">Show archived</span>
        </label>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner
        style="width: 50px; height: 50px"
        stroke-width="4"
        animation-duration=".5s"
      />
    </div>

    <div v-else-if="auditSessionsStore.allAuditSessions.length === 0">
      <p class="text-muted-color text-center py-8">
        No audit sessions found. Upload a file to create one.
      </p>
    </div>

    <DataTable
      v-else
      :value="auditSessionsStore.allAuditSessions"
      :paginator="auditSessionsStore.allAuditSessions.length > 10"
      :rows="10"
      striped-rows
      data-key="id"
    >
      <Column field="file_name" header="File Name" sortable>
        <template #body="{ data }">
          <span class="font-medium">{{ data.file_name }}</span>
        </template>
      </Column>

      <Column field="created_at" header="Created" sortable>
        <template #body="{ data }">
          {{ formatDate(data.created_at) }}
        </template>
      </Column>

      <Column field="file_size" header="Size" sortable>
        <template #body="{ data }">
          {{ formatFileSize(data.file_size) }}
        </template>
      </Column>

      <Column field="parsed_rows" header="Rows" sortable>
        <template #body="{ data }">
          {{ Array.isArray(data.parsed_rows) ? data.parsed_rows.length : 0 }}
        </template>
      </Column>

      <Column field="status" header="Status" sortable>
        <template #body="{ data }">
          <Tag
            :severity="getStatusSeverity(data.status)"
            :value="data.status"
          />
        </template>
      </Column>

      <Column header="Actions">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
              v-if="data.status !== 'archived'"
              label="Select"
              size="small"
              :disabled="
                auditSessionsStore.mostRecentAuditSession?.id === data.id
              "
              @click="selectSession(data)"
            />
            <Button
              v-if="data.status !== 'archived'"
              label="Archive"
              size="small"
              severity="secondary"
              @click="archiveSession(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
