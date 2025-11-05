<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';

const loading = ref(true);
loading.value = true;

const cookiesStore = useCookiesStore();
const seasonsStore = useSeasonsStore();
const formatHelpers = useFormatHelpers();

loading.value = false;

const toast = useToast();
const dt = ref();
const productDialog = ref(false);
const deleteProductDialog = ref(false);
const product = ref({});
const selectedProducts = ref();
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});
const submitted = ref(false);

function openNew() {
  product.value = {};
  submitted.value = false;
  productDialog.value = true;
}

function hideDialog() {
  productDialog.value = false;
  submitted.value = false;
}

async function saveProduct() {
  submitted.value = true;

  if (product?.value.name?.trim()) {
    if (product.value.id) {
      cookiesStore.upsertCookie(product.value);
    } else {
      cookiesStore.insertCookie(product.value);
    }

    productDialog.value = false;
    product.value = {};
  }
}

function editProduct(prod) {
  product.value = { ...prod };
  productDialog.value = true;
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
                class="mr-2"
                @click="openNew"
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
      v-model:visible="productDialog"
      :style="{ width: '450px' }"
      header="Product Details"
      :modal="true"
    >
      <div class="flex flex-col gap-6">
        <div>
          <label for="name" class="block font-bold mb-3">Name</label>
          <InputText
            id="name"
            v-model.trim="product.name"
            required="true"
            autofocus
            :invalid="submitted && !product.name"
            fluid
          />
          <small v-if="submitted && !product.name" class="text-red-500"
            >Name is required.</small
          >
        </div>
        <div>
          <label for="abbreviation" class="block font-bold mb-3"
            >Abbreviation</label
          >
          <InputText
            id="abbreviation"
            v-model.trim="product.abbreviation"
            required="true"
            :invalid="submitted && !product.name"
            fluid
          />
          <small v-if="submitted && !product.abbreviation" class="text-red-500"
            >Abbreviation is required.</small
          >
        </div>
        <div>
          <label for="order" class="block font-bold mb-3">Order</label>
          <InputNumber id="order" v-model.trim="product.order" fluid />
        </div>
        <div>
          <label for="percent_of_sale" class="block font-bold mb-3"
            >Percent of Sale</label
          >
          <InputNumber
            id="percent_of_sale"
            v-model.trim="product.percent_of_sale"
            fluid
            :max-fraction-digits="5"
          />
        </div>
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12">
            <label for="color" class="block font-bold mb-3">Color</label>
          </div>
          <div class="flex flex-col col-span-1">
            <ColorPicker v-model="product.color" />
          </div>
          <div class="flex flex-col w-full col-span-11">
            <InputMask
              id="color"
              v-model.trim="product.color"
              mask="#******"
              required="true"
              :invalid="submitted && !product.color"
            />
          </div>
          <div>
            <small v-if="submitted && !product.color" class="text-red-500"
              >Color is required.</small
            >
          </div>
        </div>

        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-6">
            <label for="price" class="block font-bold mb-3">Price</label>
            <InputNumber
              id="price"
              v-model="product.price"
              mode="currency"
              currency="USD"
              locale="en-US"
              fluid
            />
          </div>
        </div>

        <div class="flex items-center gap-3">
          <Checkbox
            v-model="product.is_virtual"
            input-id="is_virtual"
            :binary="true"
          />
          <label for="is_virtual" class="font-bold">
            Virtual (Donated)
            <i
              v-tooltip.bottom="{
                value:
                  'Virtual packages don\'t count against your inventory. These are packages that are donated or not physically distributed to customers. Sometimes called Cookie Share or Gift of Caring.',
                showDelay: 500,
              }"
              class="pi pi-info-circle ml-2"
              style="cursor: pointer"
            />
          </label>
        </div>

        <div class="flex items-center gap-3">
          <Checkbox
            v-model="product.overbooking_allowed"
            input-id="overbooking_allowed"
            :binary="true"
          />
          <label for="overbooking_allowed" class="font-bold">
            Allow Overbooking
            <i
              v-tooltip.bottom="{
                value:
                  'When checked, allows selling more cookies than available in inventory. Uncheck for limited varieties.',
                showDelay: 500,
              }"
              class="pi pi-info-circle ml-2"
              style="cursor: pointer"
            />
          </label>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Save" icon="pi pi-check" @click="saveProduct" />
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
  </div>
</template>
