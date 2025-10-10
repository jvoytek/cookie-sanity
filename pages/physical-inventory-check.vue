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
  editingCheckId.value = null;
  snapshotExpectedInventory.value = {};
  checkDialogVisible.value = true;
};

// Track if we're editing an existing check
const editingCheckId = ref<number | null>(null);
const snapshotExpectedInventory = ref<Record<string, number>>({});

const editCheck = (check: InventoryCheck) => {
  // Load the check data into the form
  const counts: Record<string, { cases: number; packages: number }> = {};
  
  cookiesStore.allCookies
    .filter((cookie) => !cookie.is_virtual)
    .forEach((cookie) => {
      const totalPackages = (check.physical_inventory as Record<string, number>)[cookie.abbreviation] || 0;
      const cases = Math.floor(totalPackages / 12);
      const packages = totalPackages % 12;
      counts[cookie.abbreviation] = { cases, packages };
    });
  
  physicalCounts.value = counts;
  conductedBy.value = check.conducted_by || '';
  notes.value = check.notes || '';
  editingCheckId.value = check.id;
  
  // Load the snapshot of expected inventory from when the check was created
  snapshotExpectedInventory.value = (check.expected_inventory as Record<string, number>) || {};
  
  checkDialogVisible.value = true;
};

// Calculate expected inventory for displaying in dialog
// Use snapshot if editing, otherwise calculate current
const expectedInventory = computed(() => {
  if (editingCheckId.value !== null) {
    return snapshotExpectedInventory.value;
  }
  return inventoryChecksStore.calculateExpectedInventory();
});

const cancelCheck = () => {
  checkDialogVisible.value = false;
  physicalCounts.value = {};
  editingCheckId.value = null;
  snapshotExpectedInventory.value = {};
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
  editingCheckId.value = null;
  snapshotExpectedInventory.value = {};
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
          <Button
            label="Start Physical Check"
            icon="pi pi-plus"
            @click="startNewCheck"
          />
        </div>

        <!-- Physical Inventory Check History -->
        <DataTable
          :value="inventoryChecksStore.sortedInventoryChecks"
          paginator
          :rows="10"
          size="small"
        >
          <template #empty>
            <div class="text-center py-8">
              <i
                class="pi pi-clipboard-check text-6xl text-surface-300 dark:text-surface-600 mb-4"
              />
              <h3 class="text-xl font-semibold mb-2">
                Ready to Start Physical Count
              </h3>
              <p class="text-surface-500 dark:text-surface-400">
                Click "Start Physical Check" to begin counting your physical
                inventory. You can save the check results for record-keeping or
                reconcile discrepancies immediately.
              </p>
            </div>
          </template>
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
                icon="pi pi-pencil"
                text
                rounded
                severity="secondary"
                @click="editCheck(slotProps.data)"
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
            <label class="block font-medium mb-2">Conducted By</label>
            <InputText v-model="conductedBy" class="w-full" />
          </div>
          <div>
            <label class="block font-medium mb-2">Date</label>
            <InputText
              :value="formatHelpers.formatDate(new Date().toISOString())"
              disabled
              class="w-full"
            />
          </div>
        </div>

        <div>
          <h3 class="font-semibold mb-3">Cookie Counts</h3>
          <DataTable
            :value="
              cookiesStore.allCookies.filter((c) => !c.is_virtual)
            "
            size="small"
          >
            <Column field="name" header="Cookie Type">
              <template #body="slotProps">
                <div class="flex items-center gap-2">
                  <span
                    class="w-3 h-3 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: slotProps.data.color || '#888' }"
                  />
                  <span>{{ slotProps.data.name }}</span>
                </div>
              </template>
            </Column>
            <Column header="Cases">
              <template #body="slotProps">
                <InputNumber
                  v-model="physicalCounts[slotProps.data.abbreviation].cases"
                  :min="0"
                  :use-grouping="false"
                  input-class="w-16"
                />
              </template>
            </Column>
            <Column header="Packages">
              <template #body="slotProps">
                <InputNumber
                  v-model="physicalCounts[slotProps.data.abbreviation].packages"
                  :min="0"
                  :max="11"
                  :use-grouping="false"
                  input-class="w-16"
                />
              </template>
            </Column>
            <Column header="Total Physical">
              <template #body="slotProps">
                <span class="font-bold">
                  {{
                    physicalCounts[slotProps.data.abbreviation].cases * 12 +
                    physicalCounts[slotProps.data.abbreviation].packages
                  }}
                </span>
              </template>
            </Column>
            <Column header="Digital Count">
              <template #body="slotProps">
                <span class="font-bold">
                  {{ expectedInventory[slotProps.data.abbreviation] || 0 }}
                </span>
              </template>
            </Column>
            <Column header="Variance">
              <template #body="slotProps">
                <span
                  class="font-bold"
                  :class="{
                    'text-red-600':
                      physicalCounts[slotProps.data.abbreviation].cases * 12 +
                        physicalCounts[slotProps.data.abbreviation].packages -
                        (expectedInventory[slotProps.data.abbreviation] || 0) !==
                      0,
                    'text-green-600':
                      physicalCounts[slotProps.data.abbreviation].cases * 12 +
                        physicalCounts[slotProps.data.abbreviation].packages -
                        (expectedInventory[slotProps.data.abbreviation] || 0) ===
                      0,
                  }"
                >
                  {{
                    physicalCounts[slotProps.data.abbreviation].cases * 12 +
                    physicalCounts[slotProps.data.abbreviation].packages -
                    (expectedInventory[slotProps.data.abbreviation] || 0)
                  }}
                </span>
              </template>
            </Column>
          </DataTable>
        </div>

        <div>
          <label class="block font-medium mb-2">Notes</label>
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
  </div>
</template>
