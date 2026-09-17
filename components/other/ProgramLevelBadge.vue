<script setup lang="ts">
  const props = defineProps<{
    programLevel?: string | null;
  }>();

  const programLevelDisplay = useProgramLevelDisplay();
</script>

<template>
  <span
    v-if="props.programLevel"
    :class="programLevelDisplay.programLevelClassMap[props.programLevel]"
    >{{ programLevelDisplay.getProgramLevelLabel(props.programLevel)[0] }}</span
  >
</template>
