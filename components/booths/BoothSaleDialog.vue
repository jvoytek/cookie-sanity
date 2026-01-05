<script setup lang="ts">
  import { watchDebounced, watchDeep } from '@vueuse/core';
  import { useFormKitNodeById } from '@formkit/vue';

  const boothsStore = useBoothsStore();
  const cookiesStore = useCookiesStore();
  const girlsStore = useGirlsStore();
  const formNode = useFormKitNodeById('booth-form');

  const inventoryTypeOptions = [
    { label: 'Troop Inventory', value: 'troop' },
    { label: 'Scout Inventory', value: 'scout' },
  ];

  function hideDialog() {
    boothsStore.boothDialogVisible = false;
  }

  async function saveBoothSale() {
    if (boothsStore.activeBoothSale?.id) {
      boothsStore.upsertBoothSale(boothsStore.activeBoothSale);
    } else if (boothsStore.activeBoothSale) {
      boothsStore.insertBoothSale(boothsStore.activeBoothSale);
    }
    boothsStore.boothDialogVisible = false;
    boothsStore.setActiveBoothSale(null);
  }

  const submitButtonClickHandler = () => {
    if (formNode.value) formNode.value.submit();
  };

  function cancelEditBoothSale() {
    boothsStore.resetActiveBoothSale();
    boothsStore.boothDialogVisible = false;
  }

  watchDebounced(
    () => boothsStore.activeBoothSale?.expected_sales,
    (newTotalCookies, oldTotalCookies) => {
      if (
        !boothsStore.activeBoothSale?.auto_calculate_predicted_cookies ||
        oldTotalCookies === newTotalCookies
      ) {
        return;
      }

      if (oldTotalCookies !== newTotalCookies) {
        boothsStore.setActiveBoothSalePredictedCookies(newTotalCookies || 0);
      }
    },
    { debounce: 200, maxWait: 1000 },
  );

  watchDeep(
    () => boothsStore.activeBoothSale?.predicted_cookies,
    (newCookies, _oldCookies) => {
      if (
        boothsStore.activeBoothSale?.auto_calculate_predicted_cookies ||
        newCookies === undefined
      ) {
        return;
      }

      const sumNewPredictedCookies = Object.values(newCookies).reduce(
        (sum, val) => sum + Number(val || 0),
        0,
      );

      const activeBoothSaleTotalCookies =
        boothsStore.activeBoothSale?.expected_sales || 0;

      if (sumNewPredictedCookies !== activeBoothSaleTotalCookies || 0) {
        boothsStore.setActiveBoothSaleTotalExpectedSales();
      }
    },
  );

  const data = {
    validationRules: cookiesStore.customCookieValidationRules, // Add the 'overBooking' function to the validationRules
  };

  const boothSaleDialogFormSchema = computed(() => {
    return [
      {
        $formkit: 'primeDatePicker',
        name: 'sale_date',
        label: 'Date',
        key: 'sale_date',
        placeholder: 'Select date',
        validation: 'required|date',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
        class: 'w-full',
        'date-format': 'mm/dd/yy',
        'show-icon': true,
      },
      {
        $formkit: 'primeInputText',
        name: 'sale_time',
        label: 'Time',
        key: 'sale_time',
        placeholder: 'Set time',
        validation: 'required|time',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
        class: 'w-full',
      },
      {
        $formkit: 'primeInputText',
        name: 'location',
        label: 'Location',
        key: 'location',
        placeholder: 'Walmart, Local Grocery Store, etc.',
        validation: 'required',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
        class: 'w-full',
      },
      {
        $formkit: 'primeMultiSelect',
        name: 'scouts_attending',
        options: girlsStore.girlOptions,
        'option-label': 'label',
        'option-value': 'value',
        placeholder: 'Select scouts',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
        class: 'w-full',
        label: 'Scouts Attending',
        key: 'scouts_attending',
        showToggleAll: false,
      },

      {
        $formkit: 'primeSelect',
        name: 'inventory_type',
        label: 'Inventory Type',
        key: 'inventory_type',
        placeholder: 'Choose a type',
        options: inventoryTypeOptions,
        validation: 'required',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
        class: 'w-full',
        'option-label': 'label',
        'option-value': 'value',
      },
      {
        $formkit: 'primeTextarea',
        name: 'notes',
        label: 'Notes (optional)',
        placeholder: 'Notes about this booth sale',
        class: 'w-full',
        rows: 2,
      },
      {
        $el: 'h6',
        children: 'Predicted Cookie Demand',
      },
      {
        $el: 'p',
        children:
          'Enter total estimated sales to auto-calculate cookie variety demand, or manually enter variety estimates. Setup expected cookie variety percentages in Cookie Settings.',
      },
      {
        $formkit: 'primeToggleSwitch',
        name: 'auto_calculate_predicted_cookies',
        label: 'Auto-Calculate Predicted Cookies',
        key: 'auto_calculate_predicted_cookies',
        id: 'auto_calculate_predicted_cookies',
        value: true,
        wrapperClass: 'grid grid-cols-3 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-2 mt-1 mb-1',
        class: 'w-full',
      },
      {
        $formkit: 'primeInputNumber',
        name: 'expected_sales',
        label: 'Total Estimated Sales',
        key: 'expected_sales',
        placeholder: '25, 50, 100, etc.',
        validation: 'required|integer|min:0',
        wrapperClass: 'grid grid-cols-3 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-2 mt-1 mb-1',
        class: 'w-full',
        disabled: "$get('auto_calculate_predicted_cookies').value === false",
      },
      {
        $formkit: 'group',
        name: 'predicted_cookies',
        children: cookiesStore.cookieFormFieldsForBoothSales,
        disabled: "$get('auto_calculate_predicted_cookies').value === true",
      },
    ];
  });
</script>

<template>
  <Dialog
    v-model:visible="boothsStore.boothDialogVisible"
    :style="{ width: '550px' }"
    header="Booth Sale Details"
    :modal="true"
    @after-hide="cancelEditBoothSale"
  >
    <div class="flex flex-col gap-6">
      <FormKit
        id="booth-form"
        v-model="boothsStore.activeBoothSale"
        type="form"
        :actions="false"
        @submit="saveBoothSale"
      >
        <FormKitSchema :schema="boothSaleDialogFormSchema" :data="data" />
      </FormKit>
    </div>

    <template #footer>
      <Button label="Cancel" icon="pi pi-times" outlined @click="hideDialog" />
      <Button
        label="Save"
        icon="pi pi-check"
        @click="submitButtonClickHandler"
      />
    </template>
  </Dialog>
</template>
