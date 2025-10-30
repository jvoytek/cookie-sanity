<script setup lang="ts">
import type { Order } from '@/types/types';
import CookieReceiptTable from '../other/CookieReceiptTable.vue';

const props = defineProps<{
  transaction: Order | null;
}>();

const girlsStore = useGirlsStore();
const seasonsStore = useSeasonsStore();
const accountsStore = useAccountsStore();
const cookiesStore = useCookiesStore();
const formatHelpers = useFormatHelpers();

const getFromName = (transaction: Order | null) => {
  if (!transaction) return '';
  switch (transaction.type) {
    case 'T2G':
      return seasonsStore.currentSeason?.troop_number
        ? `Troop #${seasonsStore.currentSeason.troop_number}`
        : 'Troop';
    case 'G2T':
      return girlsStore.getGirlNameById(transaction.from);
    case 'G2G':
      return girlsStore.getGirlNameById(transaction.from);
    case 'T2T':
      return seasonsStore.currentSeason?.troop_number
        ? `Troop #${seasonsStore.currentSeason.troop_number}`
        : 'Troop';
    case 'C2T':
      return transaction.supplier || 'Council';
    case 'DIRECT_SHIP':
      return 'Cookie Baker';
    default:
      return '';
  }
};

const getToName = (transaction: Order | null) => {
  if (!transaction) return '';
  switch (transaction.type) {
    case 'T2G':
      return girlsStore.getGirlNameById(transaction.to);
    case 'G2T':
      return seasonsStore.currentSeason?.troop_number
        ? `Troop #${seasonsStore.currentSeason.troop_number}`
        : 'Troop';
    case 'G2G':
      return girlsStore.getGirlNameById(transaction.to);
    case 'T2T':
      return transaction.supplier || 'Troop';
    case 'C2T':
      return seasonsStore.currentSeason?.troop_number
        ? `Troop #${seasonsStore.currentSeason.troop_number}`
        : 'Troop';
    case 'DIRECT_SHIP':
      return 'Customer of ' + girlsStore.getGirlNameById(transaction.to);
    default:
      return '';
  }
};

const calculateSubTotal = (transaction: Order | null) => {
  if (!transaction) return 0;
  let subTotal = 0;
  cookiesStore.allCookies.forEach((cookie) => {
    const count = transaction?.cookies[cookie.abbreviation] ?? 0;
    subTotal += count * cookie.price;
  });
  return subTotal;
};

const subTotal = computed(() => {
  return calculateSubTotal(props.transaction);
});

const girlAccount = computed(() => {
  if (!props.transaction || !props.transaction.to) return null;
  return accountsStore.getGirlAccountById(
    props.transaction.to,
    props.transaction.id,
    true,
  );
});

const cashCheckOtherPayments = computed(() => {
  if (!girlAccount.value?.girlPaymentsList) return 0;
  return girlAccount.value.girlPaymentsList
    .filter(
      (payment) =>
        payment.type === 'cash' ||
        payment.type === 'check' ||
        payment.type === 'other' ||
        payment.type === null,
    )
    .reduce((sum, payment) => sum + payment.amount, 0);
});

const digitalCookiePayments = computed(() => {
  if (!girlAccount.value?.girlPaymentsList) return 0;
  return girlAccount.value.girlPaymentsList
    .filter((payment) => payment.type === 'digital_cookie')
    .reduce((sum, payment) => sum + payment.amount, 0);
});
</script>
<template>
  <div class="receipt-content">
    <div class="flex justify-end">
      <div>TYPE:</div>
      <div class="w-30 ml-2 flex-none border-b border-gray-400 pb-1">
        {{ transaction.type }}
      </div>
      <div>ORDER #:</div>
      <div class="w-30 ml-2 flex-none border-b border-gray-400 pb-1">
        {{ transaction.order_num }}
      </div>
      <div>DATE:</div>
      <div class="flex-2 ml-2 border-b border-gray-400 pb-1">
        <NuxtTime :datetime="transaction.order_date" />
      </div>
    </div>
    <div class="flex mb-4">
      <div>FROM:</div>
      <div class="flex-2 ml-2 border-b border-gray-400 pb-1">
        {{ getFromName(transaction) }}
      </div>
      <div>TO:</div>
      <div class="flex-2 ml-2 border-b border-gray-400 pb-1">
        {{ getToName(transaction) }}
      </div>
      <div>TROOP #:</div>
      <div class="flex-1 ml-2 border-b border-gray-400 pb-1">
        {{ seasonsStore.currentSeason?.troop_number || 'N/A' }}
      </div>
    </div>

    <CookieReceiptTable :cookies="transaction.cookies" class="mb-4" />
    <div v-if="transaction.type === 'G2T' || transaction.type === 'T2G'">
      <h6>BALANCE</h6>
      <DataTable
        :value="[
          {
            descripton: 'SUBTOTAL',
            amount: subTotal,
          },
          {
            descripton: 'PREVIOUS BALANCE',
            amount: girlAccount?.balance || 0,
          },

          {
            descripton: 'AMOUNT STILL DUE',
            amount: girlAccount?.balance + subTotal || 0,
          },
        ]"
        size="small"
        show-gridlines
        class="no-header-datatable mb-4"
      >
        <template #header></template>
        <Column field="descripton"></Column>
        <Column field="amount">
          <template #body="slotProps">
            {{ formatHelpers.formatCurrency(slotProps.data.amount) }}
          </template>
        </Column>
      </DataTable>
      <h6>PAYMENTS</h6>
      <DataTable
        :value="[
          {
            descripton: 'CASH/CHECK/OTHER',
            amount: cashCheckOtherPayments,
          },
          {
            descripton: 'DIGITAL COOKIE',
            amount: digitalCookiePayments,
          },
          {
            descripton: 'TOTAL PAID',
            amount: girlAccount?.paymentsReceived || 0,
          },
        ]"
        size="small"
        show-gridlines
        class="no-header-datatable mb-4"
      >
        <template #header></template>
        <Column field="descripton"></Column>
        <Column field="amount">
          <template #body="slotProps">
            {{ formatHelpers.formatCurrency(slotProps.data.amount) }}
          </template>
        </Column>
      </DataTable>
    </div>

    <div class="flex justify-end mt-8" v-if="transaction?.notes">
      <div>NOTES:</div>
      <div class="flex-3 border-b border-gray-400 ml-4">
        {{ transaction?.notes }}
      </div>
    </div>

    <div class="flex justify-end mt-8">
      <div>RECEIVED BY:</div>
      <div class="flex-3 border-b border-gray-400 ml-4"></div>
      <div>TROOP #:</div>
      <div class="flex-1 border-b border-gray-400 ml-4"></div>
    </div>
    <div class="flex justify-end mt-8">
      <div>RECEIVED FROM:</div>
      <div class="flex-3 border-b border-gray-400 ml-4"></div>
      <div>TROOP #:</div>
      <div class="flex-1 border-b border-gray-400 ml-4"></div>
    </div>
  </div>
</template>
