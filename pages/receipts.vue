<script setup>
definePageMeta({
  layout: 'login',
});

const transactionsStore = useTransactionsStore();
const route = useRoute();
const transactionIds = route.query.id;
</script>

<template>
  <div
    v-for="transaction in transactionsStore
      .getTransactionsById(transactionIds)
      .sort((a, b) => a.id - b.id)"
    :key="transaction.id"
    class="card page"
  >
    <TransactionReceipt :transaction="transaction" />
  </div>
</template>
<style scoped>
.card {
  font-size: 12px;
}
@media print {
  .page,
  .page-break {
    break-after: page;
  }
}
</style>
