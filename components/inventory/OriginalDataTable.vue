<script setup lang="ts">
  import type { Json } from '@/types/supabase';

  defineProps<{
    data: Record<string, Json> | null;
    originalDataCols: { field: string; header: string }[];
  }>();
</script>

<template>
  <table>
    <tbody>
      <tr>
        <template v-for="col in originalDataCols" :key="col.field">
          <th>{{ col.header }}:</th>
          <td>{{ data && typeof data === 'object' && data[col.field] }}</td>
        </template>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
  table {
    text-align: left;
    font-size: 12px;
    background: #eee;
    width: 100%;
    line-height: 20px;
    td,
    th {
      padding: 0.1rem 0.5rem;
    }
  }
</style>
