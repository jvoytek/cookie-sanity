<script setup lang="ts">
  import type { InventoryCheck } from '@/types/types';
  import NoCookiesOverlay from '~/components/other/NoCookiesOverlay.vue';
  import type { Json } from '~/types/supabase';

  const { isMobile } = useDevice();

  const loading = ref(true);
  loading.value = true;

  const inventoryChecksStore = useInventoryChecksStore();
  const cookiesStore = useCookiesStore();
  const profileStore = useProfileStore();

  // Fetch inventory checks when page loads
  await inventoryChecksStore.fetchInventoryChecks();

  loading.value = false;

  const checkDialogVisible = ref(false);
  const deleteDialogVisible = ref(false);
  const checkToDelete = ref<InventoryCheck | null>(null);

  // Form state for new check
  const physicalCounts = ref<
    Record<string, { cases: number; packages: number }>
  >({});
  const conductedBy = ref('');
  const notes = ref('');
  const check_date = ref<string>(new Date().toLocaleString());

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
    check_date.value = new Date().toLocaleString();
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
        const totalPackages =
          (check.physical_inventory as Record<string, number>)[
            cookie.abbreviation
          ] || 0;
        const cases = Math.floor(totalPackages / 12);
        const packages = totalPackages % 12;
        counts[cookie.abbreviation] = { cases, packages };
      });

    physicalCounts.value = counts;
    conductedBy.value = check.conducted_by || '';
    notes.value = check.notes || '';
    editingCheckId.value = check.id;
    check_date.value = new Date(check.check_date).toLocaleString();

    // Load the snapshot of expected inventory from when the check was created
    snapshotExpectedInventory.value =
      (check.expected_inventory as Record<string, number>) || {};

    checkDialogVisible.value = true;
  };

  // Calculate expected inventory for displaying in dialog
  // Use snapshot if editing, otherwise calculate current
  const expectedInventory = computed(() => {
    if (editingCheckId.value !== null) {
      return snapshotExpectedInventory.value;
    }
    return cookiesStore
      .allCookiesWithInventoryTotals(false)
      .reduce((acc, item) => {
        acc[item.abbreviation] = item.onHand || 0;
        return acc;
      }, {} as Json);
  });

  const cancelCheck = () => {
    checkDialogVisible.value = false;
    physicalCounts.value = {};
    editingCheckId.value = null;
    snapshotExpectedInventory.value = {};
  };

  const saveCheck = async () => {
    // Calculate discrepancies
    const { discrepancies, totalDiscrepancies } =
      inventoryChecksStore.calculateDiscrepancies(
        physicalCounts.value,
        expectedInventory.value,
      );

    // Convert physical counts to total packages for storage
    const physicalInventoryPackages: Record<string, number> = {};
    Object.keys(physicalCounts.value).forEach((cookieAbbr) => {
      const { cases, packages } = physicalCounts.value[cookieAbbr];
      physicalInventoryPackages[cookieAbbr] = cases * 12 + packages;
    });

    const checkData = {
      physical_inventory: physicalInventoryPackages,
      expected_inventory: expectedInventory.value,
      discrepancies,
      total_discrepancies: totalDiscrepancies,
      conducted_by: conductedBy.value,
      notes: notes.value,
      status: 'completed',
    };

    if (editingCheckId.value !== null) {
      // Update existing check
      await inventoryChecksStore.updateInventoryCheck(
        editingCheckId.value,
        checkData,
      );
    } else {
      // Insert new check
      await inventoryChecksStore.insertInventoryCheck(checkData);
    }

    checkDialogVisible.value = false;
    physicalCounts.value = {};
    editingCheckId.value = null;
    snapshotExpectedInventory.value = {};
  };

  const confirmDelete = async (check: InventoryCheck) => {
    deleteDialogVisible.value = true;
    checkToDelete.value = check;
  };

  const cancelDelete = () => {
    deleteDialogVisible.value = false;
    checkToDelete.value = null;
  };

  const deleteCheck = async () => {
    if (checkToDelete.value) {
      await inventoryChecksStore.deleteInventoryCheck(checkToDelete.value.id);
    }
    deleteDialogVisible.value = false;
    checkToDelete.value = null;
  };

  const getDiscrepancySeverity = (diff: number, discrepancyText: string) => {
    if (discrepancyText === 'None') return 'success';
    if (Math.abs(diff) <= 5) return 'warn';
    return 'danger';
  };

  const getDiscrepancyText = (discrepancy: Record<string, number>) => {
    const entries = Object.entries(discrepancy);
    let hasDiscrepancies = false;
    let discrepancyText = '';
    for (const [cookieAbbr, diff] of entries) {
      if (diff !== 0) {
        hasDiscrepancies = true;
        const sign = diff > 0 ? '+' : '';

        discrepancyText += `${cookieAbbr}: ${sign}${diff} `;
      }
    }
    if (!hasDiscrepancies) return 'None';
    return discrepancyText.trim();
  };

  const getTotalPhysical = (abbreviation: string) => {
    const counts = physicalCounts.value[abbreviation];
    if (!counts) return 0;
    return counts.cases * 12 + counts.packages;
  };

  const getVariance = (abbreviation: string) => {
    return (
      getTotalPhysical(abbreviation) -
      (expectedInventory.value[abbreviation] || 0)
    );
  };

  const aLongTimeAgo = (datetime: string) => {
    const date = new Date(datetime);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays < 1) return true;
    else return false;
  };
</script>

<template>
  <div class="grid grid-cols-12 gap-8 relative">
    <div class="col-span-12">
      <div class="card">
        <h5>Physical Inventory Check</h5>
        <p>Count physical inventory and compare with digital records</p>
        <Toolbar class="mb-6">
          <template #start>
            <Button
              label="Start Physical Check"
              icon="pi pi-plus"
              @click="startNewCheck"
              severity="secondary"
            />
          </template>
        </Toolbar>
        <p v-if="inventoryChecksStore.latestInventoryCheck">
          Last check:
          <NuxtTime
            :datetime="inventoryChecksStore.latestInventoryCheck.check_date"
          />
          by {{ inventoryChecksStore.latestInventoryCheck.conducted_by }}
        </p>

        <!-- Physical Inventory Check History -->
        <ClientOnly>
          <DataTable
            v-if="!isMobile"
            :value="inventoryChecksStore.sortedInventoryChecks"
            paginator
            :rows="10"
            size="small"
          >
            <template #empty>
              <div class="text-center py-8">
                <i
                  class="pi pi-clipboard text-xl text-surface-300 dark:text-surface-600 mb-4"
                  style="font-size: 4rem"
                />
                <p
                  class="text-4xl mb-2 text-surface-300 dark:text-surface-60 font-bold"
                >
                  Ready to Start Physical Count
                </p>
                <p class="text-surface-500 dark:text-surface-400">
                  Click "Start Physical Check" to begin counting your physical
                  inventory. You can save the check results for record-keeping
                  or reconcile discrepancies immediately.
                </p>
              </div>
            </template>
            <Column field="check_date" header="Check Date" sortable>
              <template #body="slotProps">
                <NuxtTime
                  :datetime="slotProps.data.check_date"
                  :relative="aLongTimeAgo(slotProps.data.check_date)"
                />
              </template>
            </Column>
            <Column field="conducted_by" header="Conducted By" sortable />
            <Column header="Total Discrepancies" sortable>
              <template #body="slotProps">
                <Tag
                  :set="
                    discrepancyText = getDiscrepancyText(
                      slotProps.data.discrepancies,
                    )
                  "
                  :value="`${discrepancyText}`"
                  :severity="
                    getDiscrepancySeverity(
                      slotProps.data.total_discrepancies,
                      discrepancyText,
                    )
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
                  @click="confirmDelete(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>
        </ClientOnly>
      </div>
      <ClientOnly>
        <DataView
          v-if="isMobile"
          :value="inventoryChecksStore.sortedInventoryChecks"
          layout="list"
          paginator
          :rows="10"
          :pt="{ content: { class: 'bg-transparent! mb-2' } }"
        >
          <template #empty>
            <div class="text-center py-8 card">
              <i
                class="pi pi-clipboard text-xl text-surface-300 dark:text-surface-600 mb-4"
                style="font-size: 4rem"
              />
              <p
                class="text-4xl mb-2 text-surface-300 dark:text-surface-60 font-bold"
              >
                Ready to Start Physical Count
              </p>
              <p class="text-surface-500 dark:text-surface-400">
                Click "Start Physical Check" to begin counting your physical
                inventory. You can save the check results for record-keeping or
                reconcile discrepancies immediately.
              </p>
            </div>
          </template>
          <template #list="slotProps">
            <div class="flex flex-col">
              <div
                v-for="(check, index) in slotProps.items"
                :key="index"
                class="pt-2 pb-2 card"
              >
                <div class="flex justify-between items-center mb-2">
                  <div>
                    <div class="font-bold">
                      <NuxtTime
                        :datetime="check.check_date"
                        :relative="aLongTimeAgo(check.check_date)"
                      />
                    </div>
                    <span>Conducted by {{ check.conducted_by }}</span>
                  </div>
                  <div class="flex gap-2">
                    <Button
                      label="Edit"
                      icon="pi pi-pencil"
                      aria-label="Edit"
                      outlined
                      class="float-right"
                      severity="secondary"
                      @click="editCheck(check)"
                    />
                    <Button
                      icon="pi pi-trash"
                      aria-label="Delete"
                      outlined
                      class="float-right"
                      severity="warn"
                      @click="confirmDelete(check)"
                    />
                  </div>
                </div>
                <div class="flex flex-col gap-2">
                  <div>
                    Total Discrepancies:
                    <Tag
                      :set="
                        discrepancyText = getDiscrepancyText(
                          check.discrepancies,
                        )
                      "
                      :value="`${discrepancyText}`"
                      :severity="
                        getDiscrepancySeverity(
                          check.total_discrepancies,
                          discrepancyText,
                        )
                      "
                    />
                  </div>
                  <div v-if="check.notes" class="mb-2">
                    Notes: {{ check.notes }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </DataView>
      </ClientOnly>
    </div>

    <!-- Check Dialog -->
    <Dialog
      v-model:visible="checkDialogVisible"
      modal
      :style="{ width: '90vw', maxWidth: '800px' }"
      header="Physical Inventory Check"
      :dismissable-mask="true"
    >
      <div class="space-y-4">
        <div>
          <div>
            <label class="block font-medium mb-2">Conducted By</label>
            <InputText v-model="conductedBy" class="w-full" /><br />
            <span class="text-sm text-muted-color">Date: {{ check_date }}</span>
            <InputText :value="check_date" disabled class="hiddenx" />
          </div>
        </div>

        <div>
          <h3 class="font-semibold mb-3">Cookie Counts</h3>
          <DataTable
            :value="cookiesStore.allCookies.filter((c) => !c.is_virtual)"
            size="small"
          >
            <Column field="name">
              <template #header="slotProps">
                <div class="hidden lg:block flex items-center gap-2">
                  <span>Cookie</span>
                </div>
              </template>
              <template #body="slotProps">
                <div class="flex items-center gap-2">
                  <span
                    class="w-3 h-3 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: slotProps.data.color || '#888' }"
                  />
                  <span class="hidden lg:inline">{{
                    slotProps.data.name
                  }}</span>
                  <span class="inline lg:hidden">{{
                    slotProps.data.abbreviation
                  }}</span>
                </div>
              </template>
            </Column>
            <Column>
              <template #header="slotProps">
                <div class="hidden lg:block flex items-center gap-2">
                  <span>Cases</span>
                  <i
                    class="pi pi-question-circle ml-1"
                    v-tooltip.bottom="{
                      value:
                        'Enter the number of cases for each cookie. 1 case = 12 packages.',
                      showDelay: 500,
                    }"
                  ></i>
                </div>
                <span class="inline lg:hidden font-bold">CSE</span>
              </template>
              <template #body="slotProps">
                <InputNumber
                  v-model="physicalCounts[slotProps.data.abbreviation].cases"
                  :min="0"
                  :use-grouping="false"
                  input-class="w-12"
                />
              </template>
            </Column>
            <Column>
              <template #header="slotProps">
                <div class="hidden lg:block flex items-center gap-2">
                  <span>Packages</span>
                  <i
                    class="pi pi-question-circle ml-1"
                    v-tooltip.bottom="{
                      value:
                        'Enter the number of additional packages not in cases.',
                      showDelay: 500,
                    }"
                  ></i>
                </div>
                <span class="inline lg:hidden font-bold">PKG</span>
              </template>
              <template #body="slotProps">
                <InputNumber
                  v-model="physicalCounts[slotProps.data.abbreviation].packages"
                  :min="0"
                  :use-grouping="false"
                  input-class="w-12"
                />
              </template>
            </Column>
            <Column>
              <template #header="slotProps">
                <div class="hidden lg:block flex items-center gap-2">
                  <span>Total</span>
                  <i
                    class="pi pi-question-circle ml-1"
                    v-tooltip.bottom="{
                      value:
                        'Cases * 12 + Packages = Total Physical Count in Packages',
                      showDelay: 500,
                    }"
                  ></i>
                </div>
                <span class="inline lg:hidden font-bold">TOT</span>
              </template>
              <template #body="slotProps">
                <span class="font-bold">
                  {{
                    physicalCounts[slotProps.data.abbreviation].cases * 12 +
                    physicalCounts[slotProps.data.abbreviation].packages
                  }}
                </span>
              </template>
            </Column>
            <Column>
              <template #header="slotProps">
                <div class="hidden lg:block flex items-center gap-2">
                  <span>Expected Inventory</span>
                  <i
                    class="pi pi-question-circle ml-1"
                    v-tooltip.bottom="{
                      value:
                        'The expected inventory count from the digital records.',
                      showDelay: 500,
                    }"
                  ></i>
                </div>
                <span class="inline lg:hidden font-bold">EXP</span>
              </template>
              <template #body="slotProps">
                <span class="font-bold">
                  {{ expectedInventory[slotProps.data.abbreviation] || 0 }}
                </span>
              </template>
            </Column>
            <Column>
              <template #header="slotProps">
                <div class="hidden lg:block flex items-center gap-2">
                  <span>Difference</span>
                  <i
                    class="pi pi-question-circle ml-1"
                    v-tooltip.bottom="{
                      value:
                        'Difference = Total Physical Count - Expected Inventory. Positive means more physical inventory than expected, negative means less.',
                      showDelay: 500,
                    }"
                  ></i>
                </div>
                <span class="inline lg:hidden font-bold">DIF</span>
              </template>
              <template #body="slotProps">
                <span
                  class="font-bold"
                  :class="{
                    'text-red-600':
                      physicalCounts[slotProps.data.abbreviation].cases * 12 +
                        physicalCounts[slotProps.data.abbreviation].packages -
                        (expectedInventory[slotProps.data.abbreviation] ||
                          0) !==
                      0,
                    'text-green-600':
                      physicalCounts[slotProps.data.abbreviation].cases * 12 +
                        physicalCounts[slotProps.data.abbreviation].packages -
                        (expectedInventory[slotProps.data.abbreviation] ||
                          0) ===
                      0,
                  }"
                >
                  <span
                    v-if="
                      physicalCounts[slotProps.data.abbreviation].cases * 12 +
                        physicalCounts[slotProps.data.abbreviation].packages -
                        (expectedInventory[slotProps.data.abbreviation] || 0) >
                      0
                    "
                    >+</span
                  >{{
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
        <Button label="Cancel" severity="secondary" text @click="cancelCheck" />
        <Button label="Save Check" @click="saveCheck" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteDialogVisible"
      :style="{ width: '450px' }"
      header="Confirm"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
        <span v-if="checkToDelete">
          Are you sure you want to delete the check from
          <b
            ><NuxtTime
              :datetime="checkToDelete.check_date"
              :relative="aLongTimeAgo(checkToDelete.check_date)" /></b
          >?
        </span>
      </div>
      <template #footer>
        <Button label="No" icon="pi pi-times" text @click="cancelDelete" />
        <Button label="Yes" icon="pi pi-check" @click="deleteCheck" />
      </template>
    </Dialog>
    <NoCookiesOverlay />
  </div>
</template>
