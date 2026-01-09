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

  .print-report {
    padding: 0;
  }

  .no-print {
    display: none;
  }

  /* Ensure tables don't break across pages */
  .print-table {
    page-break-inside: avoid;
  }

  /* Remove any background colors for printing */
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
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
