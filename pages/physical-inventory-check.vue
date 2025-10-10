<script setup lang="ts">
import type { InventoryCheck } from '@/types/types';

const loading = ref(true);
loading.value = true;

const inventoryChecksStore = useInventoryChecksStore();
const cookiesStore = useCookiesStore();
const profileStore = useProfileStore();
const formatHelpers = useFormatHelpers();

// Fetch inventory checks when page loads
await inventoryChecksStore.fetchInventoryChecks();

loading.value = false;

const checkDialogVisible = ref(false);
const viewHistoryDialogVisible = ref(false);

// Form state for new check
const physicalCounts = ref<Record<string, { cases: number; packages: number }>>(
  {},
);
const conductedBy = ref('');
const notes = ref('');

// Initialize physical counts for all non-virtual cookies
const initializePhysicalCounts = () => {
  const counts: Record<string, { cases: number; packages: number }> = {};
  cookiesStore.allCookies
    .filter((cookie) => !cookie.is_virtual)
    .forEach((cookie) => {
      counts[cookie.abbreviation] = { cases: 0, packages: 0 };
    });
  return counts;
};

const startNewCheck = () => {
  physicalCounts.value = initializePhysicalCounts();
  conductedBy.value = profileStore.currentProfile?.display_name || '';
  notes.value = '';
  checkDialogVisible.value = true;
};

const cancelCheck = () => {
  checkDialogVisible.value = false;
  physicalCounts.value = {};
};

const saveCheck = async () => {
  // Calculate expected inventory based on completed transactions
  const expectedInventory = inventoryChecksStore.calculateExpectedInventory();

  // Calculate discrepancies
  const { discrepancies, totalDiscrepancies } =
    inventoryChecksStore.calculateDiscrepancies(
      physicalCounts.value,
      expectedInventory,
    );

  // Convert physical counts to total packages for storage
  const physicalInventoryPackages: Record<string, number> = {};
  Object.keys(physicalCounts.value).forEach((cookieAbbr) => {
    const { cases, packages } = physicalCounts.value[cookieAbbr];
    physicalInventoryPackages[cookieAbbr] = cases * 12 + packages;
  });

  await inventoryChecksStore.insertInventoryCheck({
    physical_inventory: physicalInventoryPackages,
    expected_inventory: expectedInventory,
    discrepancies,
    total_discrepancies: totalDiscrepancies,
    conducted_by: conductedBy.value,
    notes: notes.value,
    status: 'completed',
  });

  checkDialogVisible.value = false;
  physicalCounts.value = {};
};

const showHistory = () => {
  viewHistoryDialogVisible.value = true;
};

const deleteCheck = async (check: InventoryCheck) => {
  if (confirm('Are you sure you want to delete this inventory check?')) {
    await inventoryChecksStore.deleteInventoryCheck(check.id);
  }
};

const getDiscrepancySeverity = (diff: number) => {
  if (diff === 0) return 'success';
  if (Math.abs(diff) <= 5) return 'warn';
  return 'danger';
};
</script>

<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12">
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-clipboard-check text-2xl" />
              <h2 class="text-2xl font-semibold">Physical Inventory Check</h2>
            </div>
            <p class="text-surface-500 dark:text-surface-400">
              Count physical inventory and compare with digital records
            </p>
            <div
              v-if="inventoryChecksStore.latestInventoryCheck"
              class="mt-2 text-sm text-surface-600 dark:text-surface-300"
            >
              Last check:
              {{
                formatHelpers.formatDate(
                  inventoryChecksStore.latestInventoryCheck.check_date,
                )
              }}
              by {{ inventoryChecksStore.latestInventoryCheck.conducted_by }}
            </div>
          </div>
          <div class="flex gap-2">
            <Button
              label="View History"
              icon="pi pi-history"
              severity="secondary"
              @click="showHistory"
            />
            <Button
              label="Start Physical Check"
              icon="pi pi-plus"
              @click="startNewCheck"
            />
          </div>
        </div>

        <!-- Summary Card -->
        <div
          v-if="inventoryChecksStore.latestInventoryCheck"
          class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg"
        >
          <div class="grid grid-cols-3 gap-4">
            <div>
              <div class="text-sm text-surface-500 dark:text-surface-400">
                Status
              </div>
              <Tag
                :value="inventoryChecksStore.latestInventoryCheck.status"
                :severity="
                  inventoryChecksStore.latestInventoryCheck
                    .total_discrepancies === 0
                    ? 'success'
                    : 'warn'
                "
                class="mt-1"
              />
            </div>
            <div>
              <div class="text-sm text-surface-500 dark:text-surface-400">
                Total Discrepancies
              </div>
              <div class="text-2xl font-bold mt-1">
                {{
                  inventoryChecksStore.latestInventoryCheck.total_discrepancies
                }}
                packages
              </div>
            </div>
            <div>
              <div class="text-sm text-surface-500 dark:text-surface-400">
                Items Checked
              </div>
              <div class="text-2xl font-bold mt-1">
                {{
                  Object.keys(
                    inventoryChecksStore.latestInventoryCheck
                      .physical_inventory,
                  ).length
                }}
                items
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="text-center py-12 bg-surface-50 dark:bg-surface-800 rounded-lg"
        >
          <i
            class="pi pi-clipboard-check text-6xl text-surface-300 dark:text-surface-600 mb-4"
          />
          <h3 class="text-xl font-semibold mb-2">
            Ready to Start Physical Count
          </h3>
          <p class="text-surface-500 dark:text-surface-400 mb-4">
            Click "Start Physical Check" to begin counting your physical
            inventory. You can save the check results for record-keeping or
            reconcile discrepancies immediately.
          </p>
        </div>
      </div>
    </div>

    <!-- Check Dialog -->
    <Dialog
      v-model:visible="checkDialogVisible"
      modal
      :style="{ width: '90vw', maxWidth: '800px' }"
      :dismissable-mask="true"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <i class="pi pi-clipboard-check" />
          <span class="font-semibold">Physical Inventory Check</span>
        </div>
      </template>

      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Conducted By</label>
            <InputText v-model="conductedBy" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Date</label>
            <InputText
              :value="formatHelpers.formatDate(new Date().toISOString())"
              disabled
              class="w-full"
            />
          </div>
        </div>

        <div>
          <h3 class="font-semibold mb-3">Cookie Counts</h3>
          <p class="text-sm text-surface-500 dark:text-surface-400 mb-4">
            Count the number of full cases (12 packages each) and individual
            packages for each cookie type.
          </p>
          <div class="space-y-3">
            <div
              v-for="cookie in cookiesStore.allCookies.filter(
                (c) => !c.is_virtual,
              )"
              :key="cookie.id"
              class="grid grid-cols-12 gap-3 items-center p-3 bg-surface-50 dark:bg-surface-800 rounded"
            >
              <div class="col-span-4 flex items-center gap-2">
                <span
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: cookie.color || '#888' }"
                />
                <span class="font-medium">{{ cookie.name }}</span>
              </div>
              <div class="col-span-3">
                <label class="text-xs text-surface-500 block mb-1"
                  >Cases (12 each)</label
                >
                <InputNumber
                  v-model="physicalCounts[cookie.abbreviation].cases"
                  :min="0"
                  class="w-full"
                  :use-grouping="false"
                />
              </div>
              <div class="col-span-3">
                <label class="text-xs text-surface-500 block mb-1"
                  >Individual Packages</label
                >
                <InputNumber
                  v-model="physicalCounts[cookie.abbreviation].packages"
                  :min="0"
                  :max="11"
                  class="w-full"
                  :use-grouping="false"
                />
              </div>
              <div class="col-span-2 text-right">
                <div class="text-xs text-surface-500">Total</div>
                <div class="font-bold">
                  {{
                    physicalCounts[cookie.abbreviation].cases * 12 +
                    physicalCounts[cookie.abbreviation].packages
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Notes</label>
          <Textarea v-model="notes" rows="3" class="w-full" />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          text
          @click="cancelCheck"
        />
        <Button label="Save Check" @click="saveCheck" />
      </template>
    </Dialog>

    <!-- History Dialog -->
    <Dialog
      v-model:visible="viewHistoryDialogVisible"
      modal
      :style="{ width: '90vw', maxWidth: '1200px' }"
      :dismissable-mask="true"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <i class="pi pi-history" />
          <span class="font-semibold">Physical Inventory Check History</span>
        </div>
      </template>

      <DataTable
        :value="inventoryChecksStore.sortedInventoryChecks"
        paginator
        :rows="10"
        size="small"
      >
        <Column field="check_date" header="Check Date" sortable>
          <template #body="slotProps">
            {{ formatHelpers.formatDate(slotProps.data.check_date) }}
          </template>
        </Column>
        <Column field="conducted_by" header="Conducted By" sortable />
        <Column field="status" header="Status" sortable>
          <template #body="slotProps">
            <Tag :value="slotProps.data.status" severity="success" />
          </template>
        </Column>
        <Column header="Items Checked">
          <template #body="slotProps">
            {{ Object.keys(slotProps.data.physical_inventory).length }} items
          </template>
        </Column>
        <Column header="Total Discrepancies" sortable>
          <template #body="slotProps">
            <Tag
              :value="`${slotProps.data.total_discrepancies} packages`"
              :severity="
                getDiscrepancySeverity(slotProps.data.total_discrepancies)
              "
            />
          </template>
        </Column>
        <Column field="notes" header="Notes" />
        <Column header="Actions">
          <template #body="slotProps">
            <Button
              icon="pi pi-eye"
              text
              rounded
              severity="secondary"
              @click="
                inventoryChecksStore.setActiveInventoryCheck(slotProps.data)
              "
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              @click="deleteCheck(slotProps.data)"
            />
          </template>
        </Column>
      </DataTable>

      <template #footer>
        <Button
          label="Close"
          text
          @click="viewHistoryDialogVisible = false"
        />
      </template>
    </Dialog>
  </div>
</template>
