<script setup lang="ts">
import type { Json } from "@/types/supabase";

defineProps<{
  data: Record<string, Json> | null;
  originalDataCols: { field: string; header: string }[];
}>();
</script>

<template>
  <table>
    <tbody>
      <!-- <tr>
                <td style="width:5%" />
                <td style="width:10%">{{ data && typeof data === 'object' && data["DATE"].substring(0,10) }}</td>
                <td style="width:10%">{{ data && typeof data === 'object' && data["ORDER #"] }}</td>
                <td style="width:10%">{{ data && typeof data === 'object' && data["TO"] }}</td>
                <td style="width:5%">{{ data && typeof data === 'object' && data["ADV"] }}</td>
                <td style="width:5%">{{ data && typeof data === 'object' && data["TY"] }}</td>
                <td style="width:5%">{{ data && typeof data === 'object' && data["LEM"] }}</td>
                <td style="width:5%">{{ data && typeof data === 'object' && data["TRE"] }}</td>
                <td style="width:5%">{{ data && typeof data === 'object' && data["TM"] }}</td>
                <td style="width:5%">{{ data && typeof data === 'object' && data["PBP"] }}</td>
                <td style="width:5%">{{ data && typeof data === 'object' && data["CD"] }}</td>
                <td style="width:5%">{{ data && typeof data === 'object' && data["PBS"] }}</td>
                <td style="width:5%">{{ data && typeof data === 'object' && data["GFC"] }}</td>
                <td style="width:5%">{{ data && typeof data === 'object' && data["CShare"] }}</td>
                <td style="width:5%">{{ data && typeof data === 'object' && data["TOTAL"] }}</td>
                <td />
                <td />
            </tr>  -->
      <tr>
        <template v-for="col in originalDataCols" :key="col.field">
          <th>{{ col.header }}:</th>
          <td>{{ data && typeof data === "object" && data[col.field] }}</td>
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
    v-align: middle;
  }
}
</style>
