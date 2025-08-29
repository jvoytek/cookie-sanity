<script setup lang="ts">
import { useCookiesStore } from "@/stores/cookies";
const cookiesStore = useCookiesStore();

defineProps<{
  cookies: Json;
}>();

const totalCookies = (cookies) => {
  return cookiesStore.allCookies
    .filter(
      (cookie) =>
        cookies[cookie.abbreviation] != null &&
        cookies[cookie.abbreviation] !== 0,
    )
    .reduce((sum, cookie) => {
      return sum + cookies[cookie.abbreviation];
    }, 0);
};
</script>

<template>
  <div class="flex flex-wrap gap-1">
    <span
      v-for="cookie in cookiesStore.allCookies.filter(
        (cookie) =>
          cookies[cookie.abbreviation] != null &&
          cookies[cookie.abbreviation] !== 0,
      )"
      :key="cookie.id"
      class="text-sm flex items-center gap-2"
    >
      <span
        class="w-2 h-2 rounded-full flex-shrink-0"
        :style="{
          backgroundColor: cookie.color || '#888',
        }"
      />
      <span>{{ cookies[cookie.abbreviation] }} {{ cookie.name }}, </span>
    </span>
    <span class="text-sm"> Total: {{ totalCookies(cookies) }} </span>
  </div>
</template>
