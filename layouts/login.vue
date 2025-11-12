<script setup>
  import { useLayout } from '@/composables/useLayout';
  import { onMounted } from 'vue';

  const { initializeDarkMode } = useLayout();

  // Initialize dark mode on mount
  onMounted(() => {
    initializeDarkMode();
  });
</script>

<template>
  <div>
    <slot />
  </div>
</template>
