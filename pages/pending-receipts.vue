<script setup lang="ts">
const transactionsStore = useTransactionsStore();
</script>
<template>
  <div class="card">
    <h1>Pending Receipts</h1>
    <p>List of all pending receipts for review and approval.</p>
  </div>
  <div
    class="card"
    :style="{ width: '600px' }"
    v-for="transaction in transactionsStore.pendingTransactionsRequiringReceipt"
    :key="transaction.id"
  >
    <TransactionReceipt :transaction="transaction" />
  </div>
</template>
