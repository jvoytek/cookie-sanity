<script setup lang="ts">
  import { FilterMatchMode } from '@primevue/core/api';
  import { useToast } from 'primevue/usetoast';
  import { useFormKitNodeById } from '@formkit/vue';
  import type { CookieDefault } from '~/types/types';

  const loading = ref(true);
  loading.value = true;

  const cookiesStore = useCookiesStore();
  const seasonsStore = useSeasonsStore();
  const formatHelpers = useFormatHelpers();
  const profilesStore = useProfileStore();

  loading.value = false;

  const toast = useToast();
  const cookieDialogVisible = ref(false);
  const defaultsDialogVisible = ref(false);
  const deleteProductDialog = ref(false);
  const copyCookiesDialogVisible = ref(false);
  const product = ref({});
  const selectedProducts = ref();
  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const submitted = ref(false);

  // Check if there are other seasons
  const hasOtherSeasons = computed(() => {
    return seasonsStore.allSeasons.some(
      (season) => season.id !== seasonsStore.currentSeason?.id,
    );
  });

  function openNew() {
    product.value = {};
    submitted.value = false;
    cookieDialogVisible.value = true;
  }

  function hideDialog() {
    cookieDialogVisible.value = false;
    submitted.value = false;
  }

  async function saveProduct() {
    submitted.value = true;

    if (product?.value.name?.trim()) {
      // Ensure color has # prefix
      if (product.value.color && !product.value.color.startsWith('#')) {
        product.value.color = '#' + product.value.color;
      }

      if (product.value.id) {
        console.log(product.value);
        cookiesStore.upsertCookie(product.value);
      } else {
        console.log(product.value);

        cookiesStore.insertCookie(product.value);
      }

      cookieDialogVisible.value = false;
      product.value = {};
    }
  }

  function editProduct(prod) {
    product.value = { ...prod };
    cookieDialogVisible.value = true;
  }

  function confirmDeleteProduct(prod) {
    product.value = prod;
    deleteProductDialog.value = true;
  }

  async function deleteProduct() {
    try {
      cookiesStore.deleteCookie(product.value);
      deleteProductDialog.value = false;
      product.value = {};
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message,
        life: 3000,
      });
    }
  }

  async function onRowReorder(event) {
    cookiesStore.reorderCookies(event.value);
  }

  const cookieDialogFormSchema = [
    {
      $formkit: 'primeInputText',
      name: 'name',
      label: 'Name',
      key: 'name',
      placeholder: 'Enter cookie name',
      validation: 'required',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeInputText',
      name: 'abbreviation',
      label: 'Abbreviation',
      key: 'abbreviation',
      placeholder: 'TM, CR, etc.',
      validation: 'required',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $el: 'div',
      attrs: {
        class: 'grid grid-cols-5 gap-4 items-center',
      },
      children: [
        {
          $el: 'div',
          attrs: {
            class: 'col-span-2',
          },
        },
        {
          $el: 'div',
          attrs: {
            class: 'col-span-3 text-sm text-gray-500',
          },
          children:
            "(abbreviation must match cooker baker's software for auditing)",
        },
      ],
    },
    {
      $formkit: 'primeInputNumber',
      name: 'order',
      label: 'Order',
      key: 'order',
      min: 0,
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $el: 'div',
      attrs: {
        class: 'grid grid-cols-5 gap-4 items-center',
      },
      children: [
        {
          $el: 'div',
          attrs: {
            class: 'col-span-2',
          },
        },
        {
          $el: 'div',
          attrs: {
            class: 'col-span-3 text-sm text-gray-500',
          },
          children:
            '(The order in which cookies are displayed in the app and reports)',
        },
      ],
    },
    {
      $formkit: 'primeInputNumber',
      name: 'percent_of_sale',
      label: 'Percent of Sale',
      key: 'percent_of_sale',
      minFractionDigits: 0,
      maxFractionDigits: 2,
      placeholder: 'Expected % of total sale',
      min: 0,
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $el: 'div',
      attrs: {
        class: 'grid grid-cols-5 gap-4 items-center',
      },
      children: [
        {
          $el: 'div',
          attrs: {
            class: 'col-span-2',
          },
        },
        {
          $el: 'div',
          attrs: {
            class: 'col-span-3 text-sm text-gray-500',
          },
          children: '(used for inventory projections)',
        },
      ],
    },
    {
      $formkit: 'primeColorPicker',
      name: 'color',
      label: 'Color',
      key: 'color',
      placeholder:
        'Hex color code for the cookie (e.g. #ff0000). Used for charts and inventory management.',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeInputNumber',
      name: 'price',
      label: 'Price',
      key: 'price',
      mode: 'currency',
      currency: 'USD',
      locale: 'en-US',
      min: 0,
      validation: 'required',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $formkit: 'primeCheckbox',
      name: 'is_virtual',
      label: 'Virtual (Donated)',
      key: 'is_virtual',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
    },
    {
      $el: 'div',
      attrs: {
        class: 'grid grid-cols-5 gap-4 items-center',
      },
      children: [
        {
          $el: 'div',
          attrs: {
            class: 'col-span-2',
          },
        },
        {
          $el: 'div',
          attrs: {
            class: 'col-span-3 text-sm text-gray-500',
          },
          children: "(don't count towards on-hand inventory)",
        },
      ],
    },
    {
      $formkit: 'primeCheckbox',
      name: 'overbooking_allowed',
      label: 'Allow Overbooking',
      key: 'overbooking_allowed',
      wrapperClass: 'grid grid-cols-5 gap-4 items-center',
      labelClass: 'col-span-2',
      innerClass: 'col-span-3 mt-1 mb-1',
      class: 'w-full',
      value: true,
    },
    {
      $el: 'div',
      attrs: {
        class: 'grid grid-cols-5 gap-4 items-center',
      },
      children: [
        {
          $el: 'div',
          attrs: {
            class: 'col-span-2',
          },
        },
        {
          $el: 'div',
          attrs: {
            class: 'col-span-3 text-sm text-gray-500',
          },
          children:
            '(allow requests, etc that exceed on-hand/pending inventory)',
        },
      ],
    },
  ];

  const formNode = useFormKitNodeById('cookie-form');

  const submitHandler = () => {
    saveProduct();
  };

  const submitButtonClickHandler = () => {
    if (formNode.value) formNode.value.submit();
  };

  const cookieSetToCopy = ref<CookieDefault | null>(null);

  const saveCookiesAsDefault = async () => {
    await cookiesStore.saveCurrentSeasonCookiesAsDefault();
  };

  const openDefaultsDialog = () => {
    defaultsDialogVisible.value = true;
  };

  const closeDefaultsDialog = () => {
    defaultsDialogVisible.value = false;
  };

  const confirmCopyFromDefaults = async (defaultSet: CookieDefault) => {
    await cookiesStore.copyDefaultCookiesToCurrentSeason(defaultSet);
    defaultsDialogVisible.value = false;
  };
</script>

<template>
  <div class="col-span-12">
    <div class="card">
      <h5>
        Cookie Settings for
        {{ seasonsStore.getSeasonName(seasonsStore.currentSeason) }}
      </h5>

      <div>
        <div class="card">
          <Toolbar class="mb-6">
            <template #start>
              <Button
                label="New"
                icon="pi pi-plus"
                severity="secondary"
                @click="openNew"
              />
              <Button
                v-if="hasOtherSeasons"
                label="Copy from previous season"
                icon="pi pi-copy"
                severity="secondary"
                variant="outlined"
                class="ml-2"
                @click="copyCookiesDialogVisible = true"
              />
              <Button
                v-if="cookiesStore.defaultCookieSets.length > 0"
                label="Add cookies from council defaults"
                icon="pi pi-plus"
                severity="secondary"
                variant="outlined"
                class="ml-2"
                @click="openDefaultsDialog()"
              />
              <Button
                v-if="
                  profilesStore.isAdmin && cookiesStore.allCookies.length > 0
                "
                label="Save cookies as default"
                severity="secondary"
                variant="outlined"
                class="ml-2"
                @click="saveCookiesAsDefault"
              />
            </template>
          </Toolbar>

          <DataTable
            ref="dt"
            v-model:selection="selectedProducts"
            :value="cookiesStore.allCookies"
            data-key="id"
            :filters="filters"
            sort-field="order"
            @row-reorder="onRowReorder"
          >
            <template #header>
              <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Manage Cookies</h4>
                <IconField>
                  <InputIcon>
                    <i class="pi pi-search" />
                  </InputIcon>
                  <InputText
                    v-model="filters['global'].value"
                    placeholder="Search..."
                  />
                </IconField>
              </div>
            </template>

            <Column
              row-reorder
              header-style="width: 3rem"
              :reorderable-column="false"
            />
            <Column field="order" header="Order" />
            <Column field="name" header="Name" />
            <Column field="price" header="Price">
              <template #body="slotProps">
                {{ formatHelpers.formatCurrency(slotProps.data.price) }}
              </template>
            </Column>
            <Column field="color" header="Color">
              <template #body="slotProps">
                <Badge
                  size="xlarge"
                  :style="{ backgroundColor: slotProps.data.color }"
                />
              </template>
            </Column>
            <Column field="abbreviation" header="Abbrv." />
            <Column field="percent_of_sale">
              <template #header>
                <strong>% of Sale</strong>
                <i
                  v-tooltip.bottom="{
                    value:
                      'Expected percentage of total sale. Used for inventory needs calculations.',
                    showDelay: 500,
                  }"
                  class="pi pi-info-circle ml-2"
                  style="cursor: pointer"
                />
              </template>
              <template #body="slotProps">
                {{ slotProps.data.percent_of_sale || 0 }}%
              </template>
            </Column>
            <Column field="overbooking_allowed">
              <template #header>
                <strong>Overbooking Allowed</strong>
                <i
                  v-tooltip.bottom="{
                    value:
                      'When checked, allows creating transactions for more cookies than are currently available in inventory. Uncheck for limited varieties.',
                    showDelay: 500,
                  }"
                  class="pi pi-info-circle ml-2"
                  style="cursor: pointer"
                />
              </template>
              <template #body="slotProps">
                <i
                  v-if="slotProps.data.overbooking_allowed"
                  class="pi pi-check text-green-500"
                />
              </template>
            </Column>
            <Column field="is_virtual">
              <template #header>
                <strong>Virtual (Donated)</strong>
                <i
                  v-tooltip.bottom="{
                    value:
                      'Virtual packages don\'t count against your inventory. These are packages that are donated or not physically distributed to customers. Sometimes called Cookie Share or Gift of Caring.',
                    showDelay: 500,
                  }"
                  class="pi pi-info-circle ml-2"
                  style="cursor: pointer"
                />
              </template>
              <template #body="slotProps">
                <i
                  v-if="slotProps.data.is_virtual"
                  class="pi pi-check text-green-500"
                />
              </template>
            </Column>
            <Column :exportable="false" nowrap>
              <template #body="slotProps">
                <Button
                  v-tooltip.bottom="{ value: 'Edit', showDelay: 500 }"
                  aria-label="Edit"
                  icon="pi pi-pencil"
                  class="mr-2"
                  variant="outlined"
                  severity="secondary"
                  @click="editProduct(slotProps.data)"
                />
                <Button
                  v-tooltip.bottom="{ value: 'Delete', showDelay: 500 }"
                  aria-label="Delete"
                  icon="pi pi-trash"
                  class="mr-2"
                  variant="outlined"
                  severity="warn"
                  @click="confirmDeleteProduct(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="cookieDialogVisible"
      :style="{ width: '450px' }"
      header="Product Details"
      :modal="true"
    >
      <div class="flex flex-col gap-6">
        <FormKit
          id="cookie-form"
          v-model="product"
          type="form"
          :actions="false"
          @submit="submitHandler"
        >
          <!-- Render the dynamic form using the schema -->
          <FormKitSchema :schema="cookieDialogFormSchema" />
        </FormKit>
      </div>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
        <Button
          label="Save"
          icon="pi pi-check"
          @click="submitButtonClickHandler"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="defaultsDialogVisible"
      :style="{ width: '450px' }"
      header="Add Cookies from Council Defaults"
      :modal="true"
    >
      <div class="flex flex-col gap-4">
        <span
          >Select a default cookie set to copy from. This will add all cookies
          from the selected set to your current list, it will not overwrite
          existing cookies (if there are any).</span
        >
        <Listbox
          v-model="cookieSetToCopy"
          :options="cookiesStore.defaultCookieSets"
          filter
          optionLabel="name"
        />
        <div v-for="cookie in cookieSetToCopy?.defaults" :key="cookie.id">
          <div class="flex items-center gap-2">
            <Badge size="small" :style="{ backgroundColor: cookie.color }" />
            <span>{{ cookie.name }}</span>
            <span class="text-sm text-gray-500">
              ({{ formatHelpers.formatCurrency(cookie.price) }}
              {{
                cookie.percent_of_sale
                  ? `${cookie.percent_of_sale}% of sale`
                  : ''
              }})
            </span>
          </div>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          text
          @click="closeDefaultsDialog"
        />
        <Button
          label="Add these cookies to current season"
          icon="pi pi-check"
          @click="confirmCopyFromDefaults(cookieSetToCopy)"
          :disabled="!cookieSetToCopy"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteProductDialog"
      :style="{ width: '450px' }"
      header="Confirm"
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span v-if="product"
          >Are you sure you want to delete <b>{{ product.name }}</b
          >?</span
        >
      </div>
      <template #footer>
        <Button
          label="No"
          icon="pi pi-times"
          text
          @click="deleteProductDialog = false"
        />
        <Button label="Yes" icon="pi pi-check" @click="deleteProduct" />
      </template>
    </Dialog>

    <CopyCookiesDialog v-model:visible="copyCookiesDialogVisible" />
  </div>
</template>
