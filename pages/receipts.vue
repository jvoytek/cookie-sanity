<script setup>
  definePageMeta({
    layout: 'login',
  });

  const transactionsStore = useTransactionsStore();
  const route = useRoute();
  const transactionIds = route.query.id;
</script>

<template>
  <div>
    <div
      v-for="transaction in transactionsStore.getTransactionsById(
        transactionIds,
      )"
      :key="transaction.id"
      class="card page"
    >
      <TransactionReceipt :transaction="transaction" />
    </div>
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
