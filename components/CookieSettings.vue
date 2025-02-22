<script setup>
import { FilterMatchMode } from "@primevue/core/api";
import { useToast } from "primevue/usetoast";

const supabase = useSupabaseClient();

const loading = ref(true);

loading.value = true;
const user = useSupabaseUser();

const { data: products } = await useAsyncData(
  "products",
  async () => supabase.from("cookies").select(`*`).eq("profile", user.value.id),
  { transform: (result) => result.data },
);

loading.value = false;

async function updateCookies() {
  try {
    loading.value = true;
    const user = useSupabaseUser();

    const updates = {
      id: user.value.id,
      username: username.value,
      website: website.value,
      avatar_url: avatar_path.value,
      updated_at: new Date(),
    };

    const { error } = await supabase.from("profiles").upsert(updates, {
      returning: "minimal", // Don't return the value after inserting
    });

    if (error) throw error;
  } catch (error) {
    alert(error.message);
  } finally {
    loading.value = false;
  }
}

const toast = useToast();
const dt = ref();
const productDialog = ref(false);
const deleteProductDialog = ref(false);
const deleteProductsDialog = ref(false);
const product = ref({});
const selectedProducts = ref();
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});
const submitted = ref(false);

function formatCurrency(value) {
  if (value)
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  return;
}

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
  const user = useSupabaseUser();

  if (product?.value.name?.trim()) {
    if (product.value.id) {
      products.value[findIndexById(product.value.id)] = product.value;

      try {
        const { error } = await supabase.from("cookies").upsert(product.value);

        if (error) throw error;

        toast.add({
          severity: "success",
          summary: "Successful",
          detail: "Product Updated",
          life: 3000,
        });
      } catch (error) {
        console.log(error.message);
        toast.add({
          severity: "error",
          summary: "Error",
          detail: error.message,
          life: 3000,
        });
      }
    } else {
      product.value.profile = user.value.id;
      try {
        const { data, error } = await supabase
          .from("cookies")
          .insert(product.value)
          .select();

        if (error) throw error;

        products.value.push(data[0]);
        toast.add({
          severity: "success",
          summary: "Successful",
          detail: "Product Created",
          life: 3000,
        });
      } catch (error) {
        console.log(error.message);
        toast.add({
          severity: "error",
          summary: "Error",
          detail: error.message,
          life: 3000,
        });
      }
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
    const { error } = await supabase
      .from("cookies")
      .delete()
      .eq("id", product.value.id);

    if (error) throw error;

    products.value = products.value.filter(
      (val) => val.id !== product.value.id,
    );
    deleteProductDialog.value = false;
    product.value = {};
    toast.add({
      severity: "success",
      summary: "Successful",
      detail: "Product Deleted",
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message,
      life: 3000,
    });
  }
}

function findIndexById(id) {
  let index = -1;
  for (let i = 0; i < products.value.length; i++) {
    if (products.value[i].id === id) {
      index = i;
      break;
    }
  }

  return index;
}

function confirmDeleteSelected() {
  deleteProductsDialog.value = true;
}

async function deleteSelectedProducts() {
  try {
    const { error } = await supabase
      .from("cookies")
      .delete()
      .in(
        "id",
        selectedProducts.value.map((val) => val.id),
      );

    if (error) throw error;

    products.value = products.value.filter(
      (val) => !selectedProducts.value.includes(val),
    );
    deleteProductsDialog.value = false;
    selectedProducts.value = null;
    toast.add({
      severity: "success",
      summary: "Successful",
      detail: "Products Deleted",
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message,
      life: 3000,
    });
  }
}

async function onRowReorder(event) {
  event.value.forEach((cookie, i) => {
    const index = findIndexById(cookie.id);
    products.value[index].order = i;
  });

  products.value.sort(function (cookiea, cookieb) {
    return cookiea.order - cookieb.order;
  });

  try {
    const { error } = await supabase.from("cookies").upsert(products.value);
    if (error) throw error;
    toast.add({
      severity: "success",
      summary: "Product Reordered",
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.message,
      life: 3000,
    });
  }
}
</script>

<template>
  <div class="col-span-12 lg:col-span-8 xl:col-span-8">
    <div class="card">
      <h5>Cookie Settings</h5>

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
            :value="products"
            data-key="id"
            :filters="filters"
            sort-field="order"
            @row-reorder="onRowReorder"
          >
            <template #header>
              <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Manage Products</h4>
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
            <Column field="order" header="Order"/>
            <Column field="name" header="Name"/>
            <Column field="price" header="Price">
              <template #body="slotProps">
                {{ formatCurrency(slotProps.data.price) }}
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
            <Column :exportable="false" nowrap>
              <template #body="slotProps">
                <Button
                  icon="pi pi-pencil"
                  outlined
                  rounded
                  class="mr-2"
                  @click="editProduct(slotProps.data)"
                />
                <Button
                  icon="pi pi-trash"
                  outlined
                  rounded
                  severity="danger"
                  @click="confirmDeleteProduct(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>
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
              <label for="order" class="block font-bold mb-3">Order</label>
              <InputNumber id="order" v-model.trim="product.order" fluid />
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
          </div>

          <template #footer>
            <Button
              label="Cancel"
              icon="pi pi-times"
              text
              @click="hideDialog"
            />
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

        <Dialog
          v-model:visible="deleteProductsDialog"
          :style="{ width: '450px' }"
          header="Confirm"
          :modal="true"
        >
          <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span v-if="product"
              >Are you sure you want to delete the selected products?</span
            >
          </div>
          <template #footer>
            <Button
              label="No"
              icon="pi pi-times"
              text
              @click="deleteProductsDialog = false"
            />
            <Button
              label="Yes"
              icon="pi pi-check"
              text
              @click="deleteSelectedProducts"
            />
          </template>
        </Dialog>
      </div>
    </div>
  </div>
</template>
