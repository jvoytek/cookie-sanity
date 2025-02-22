<script setup>
import { FilterMatchMode } from "@primevue/core/api";
import { useToast } from "primevue/usetoast";

const supabase = useSupabaseClient();

const loading = ref(true);

loading.value = true;
const user = useSupabaseUser();

const { data: girls } = await useAsyncData(
  "girls",
  async () => supabase.from("sellers").select(`*`).eq("profile", user.value.id),
  { transform: (result) => result.data },
);

loading.value = false;

const toast = useToast();
const dt = ref();
const girlDialog = ref(false);
const deleteGirlDialog = ref(false);
const girl = ref({});
const selectedGirls = ref();
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});
const submitted = ref(false);

function openNew() {
  girl.value = {};
  submitted.value = false;
  girlDialog.value = true;
}

function hideDialog() {
  girlDialog.value = false;
  submitted.value = false;
}

async function saveGirl() {
  submitted.value = true;
  const user = useSupabaseUser();
  console.log(girl.value.first_name);
  if (girl?.value.first_name?.trim()) {
    if (girl.value.id) {
      girls.value[findIndexById(girl.value.id)] = girl.value;

      try {
        const { error } = await supabase.from("sellers").upsert(girl.value);

        if (error) throw error;

        toast.add({
          severity: "success",
          summary: "Successful",
          detail: "Girl Updated",
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
      girl.value.profile = user.value.id;
      try {
        const { data, error } = await supabase
          .from("sellers")
          .insert(girl.value)
          .select();

        if (error) throw error;

        girls.value.push(data[0]);
        toast.add({
          severity: "success",
          summary: "Successful",
          detail: "Girl Created",
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

    girlDialog.value = false;
    girl.value = {};
  }
}

function editGirl(g) {
  girl.value = { ...g };
  girlDialog.value = true;
}

function confirmDeleteGirl(g) {
  girl.value = g;
  deleteGirlDialog.value = true;
}

async function deleteGirl() {
  try {
    const { error } = await supabase
      .from("sellers")
      .delete()
      .eq("id", girl.value.id);

    if (error) throw error;

    girls.value = girls.value.filter(
      (val) => val.id !== girl.value.id,
    );
    deleteGirlDialog.value = false;
    girl.value = {};
    toast.add({
      severity: "success",
      summary: "Successful",
      detail: "Cookie Deleted",
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
  for (let i = 0; i < girls.value.length; i++) {
    if (girls.value[i].id === id) {
      index = i;
      break;
    }
  }

  return index;
}

</script>

<template>
  <div class="col-span-12 lg:col-span-8 xl:col-span-8">
    <div class="card">
      <h5>Girl Settings</h5>

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
            v-model:selection="selectedGirls"
            :value="girls"
            data-key="id"
            :filters="filters"
            sort-field="first_name"
            sort-order="1"
          >
            <template #header>
              <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Manage Girls</h4>
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

            <Column field="first_name" header="First Name" sortable/>
            <Column field="last_name" header="Last Name" sortable/>
            <Column field="preferred_name" header="Preferred Name" sortable/>
            <Column :exportable="false" nowrap>
              <template #body="slotProps">
                <Button
                  icon="pi pi-pencil"
                  outlined
                  rounded
                  class="mr-2"
                  @click="editGirl(slotProps.data)"
                />
                <Button
                  icon="pi pi-trash"
                  outlined
                  rounded
                  severity="danger"
                  @click="confirmDeleteGirl(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>
        </div>

        <Dialog
          v-model:visible="girlDialog"
          :style="{ width: '450px' }"
          header="Girl Details"
          :modal="true"
        >
          <div class="flex flex-col gap-6">
            <div>
              <label for="first_name" class="block font-bold mb-3">First Name</label>
              <InputText
                id="first_name"
                v-model.trim="girl.first_name"
                required="true"
                autofocus
                :invalid="submitted && !girl.first_name"
                fluid
              />
              <small v-if="submitted && !girl.first_name" class="text-red-500"
                >First Name is required.</small
              >
            </div>
            <div>
              <label for="last_name" class="block font-bold mb-3">Last Name</label>
              <InputText
                id="last_name"
                v-model.trim="girl.last_name"
                required="true"
                autofocus
                :invalid="submitted && !girl.last_name"
                fluid
              />
              <small v-if="submitted && !girl.last_name" class="text-red-500"
                >Last Name is required.</small
              >
            </div>
            <div>
              <label for="preferred_name" class="block font-bold mb-3">Preferred Name</label>
              <InputText
                id="preferred_name"
                v-model.trim="girl.preferred_name"
                autofocus
                :invalid="submitted && !girl.preferred_name"
                fluid
              />
            </div>
          </div>

          <template #footer>
            <Button
              label="Cancel"
              icon="pi pi-times"
              text
              @click="hideDialog"
            />
            <Button label="Save" icon="pi pi-check" @click="saveGirl" />
          </template>
        </Dialog>

        <Dialog
          v-model:visible="deleteGirlDialog"
          :style="{ width: '450px' }"
          header="Confirm"
          :modal="true"
        >
          <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span v-if="girl"
              >Are you sure you want to delete <b>{{ girl.first_name }}</b
              >?</span
            >
          </div>
          <template #footer>
            <Button
              label="No"
              icon="pi pi-times"
              text
              @click="deleteGirlDialog = false"
            />
            <Button label="Yes" icon="pi pi-check" @click="deleteGirl" />
          </template>
        </Dialog>
      </div>
    </div>
  </div>
</template>
