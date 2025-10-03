<script setup lang="ts">
import { useCookiesStore } from '@/stores/cookies';
const cookiesStore = useCookiesStore();

const props = defineProps<{
  cookies: Record<string, number>;
}>();

const totalCookies = (cookies: Record<string, number>) => {
  return cookiesStore.allCookies.reduce((total, cookie) => {
    const count = cookies[cookie.abbreviation] ?? 0;
    return count ? total + count : total;
  }, 0);
};

const cookiesWithValues = (cookies: Record<string, number>) => {
  return cookiesStore.allCookies.filter(
    (cookie) =>
      cookies[cookie.abbreviation] != null &&
      cookies[cookie.abbreviation] !== 0,
  );
};
</script>

<template>
  <div v-if="cookiesStore.allCookies.length" class="flex flex-wrap gap-1">
    <span
      v-for="cookie in cookiesWithValues(props.cookies)"
      :key="cookie.id"
      class="text-sm flex items-center gap-2"
    >
      <span
        class="w-2 h-2 rounded-full flex-shrink-0"
        :style="{
          backgroundColor: cookie.color || '#888',
        }"
      />
      <span>{{ props.cookies[cookie.abbreviation] }} {{ cookie.name }}</span>
      <i
        v-if="cookie.is_virtual"
        v-tooltip.bottom="{
          value: 'Virtual packages don\'t count against your inventory',
          showDelay: 500,
        }"
        class="pi pi-info-circle text-blue-500"
        style="cursor: pointer; font-size: 0.75rem"
      />
      <span>, </span>
    </span>
    <span class="text-sm"> Total: {{ totalCookies(props.cookies) }} </span>
  </div>
</template>
