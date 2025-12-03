<script setup>
  // Minimal layout for printing - no navigation or sidebar
</script>

<template>
  <div class="print-layout">
    <slot />
  </div>
</template>

<style scoped>
  .print-layout {
    padding: 2rem;
    max-width: 100%;
    background-color: #fff;
    font-size: 10pt;
  }

  @media print {
    .print-layout {
      padding: 0;
      font-size: 8pt;
    }

    .page,
    .page-break {
      break-after: page;
    }
  }
</style>
