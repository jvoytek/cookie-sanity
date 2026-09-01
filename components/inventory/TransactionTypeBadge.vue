<script setup lang="ts">
  const props = defineProps<{
    type: string;
  }>();
  const transactionsStore = useTransactionsStore();
  const transactionHelpers = useTransactionHelpers();

  const getTransactionTypeIconClass = (type: string) => {
    switch (type) {
      case 'T2G':
        return 'pi pi-arrow-down mr-1';
      case 'T2G(B)':
        return 'pi pi-arrow-down mr-1';
      case 'T2G(VB)':
        return 'pi pi-arrow-down mr-1';
      case 'G2T':
        return 'pi pi-arrow-up mr-1';
      case 'G2G':
        return 'pi pi-arrow-right-arrow-left mr-1';
      case 'DIRECT_SHIP':
        return 'pi pi-truck mr-1';
      default:
        return '';
    }
  };
</script>
<template>
  <Badge :severity="transactionHelpers.transactionTypeBadgeSeverity(props.type)"
    ><i :class="getTransactionTypeIconClass(props.type)"></i
    >{{ transactionsStore.friendlyTransactionTypes(props.type) }}</Badge
  >
</template>
