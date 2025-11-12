<script setup lang="ts">
import type { CookieSummary } from '@/types/types';
const cookiesStore = useCookiesStore();
const formatHelpers = useFormatHelpers();

const props = defineProps<{
  cookieSummary: CookieSummary | {};
  totalPayments: number;
  stillDue: number;
}>();

const accountsStore = useAccountsStore();

const listofCookieAbbreviations = computed(() => {
  return cookiesStore.allCookies.map((cookie) => cookie.abbreviation);
});

interface AccountSummaryRow {
  label: string;
  // Dynamic keys for each cookie abbreviation
  [key: string]: string | number;
  total: number | string;
}

const cookieSummaryDataTableFormat = computed(() => {
  // reformat props.cookieSummary into an array of AccountSummaryRow
  const rows: AccountSummaryRow[] = [
    /*{
      label: '',
      CShare: 'Num Packages', //the last cookie abbreviation key set to empty string
      total: (props.cookieSummary as CookieSummary).countAllPackages || 0,
    },
    {
      label: '',
      CShare: 'Total Due', //the last cookie abbreviation key set to empty string
      total:
        formatHelpers.formatCurrency(
          (props.cookieSummary as CookieSummary).totalDue,
        ) || formatHelpers.formatCurrency(0),
    },
    {
      label: '',
      CShare: 'Payments', //the last cookie abbreviation key set to empty string
      total:
        formatHelpers.formatCurrency(props.totalPayments) ||
        formatHelpers.formatCurrency(0),
    },
    {
      label: '',
      CShare: 'Still Due', //the last cookie abbreviation key set to empty string
      total:
        formatHelpers.formatCurrency(props.stillDue) ||
        formatHelpers.formatCurrency(0),
    },*/
  ];
  return rows;
});
</script>

<template>
  <div class="p-datatable p-component p-datatable-gridlines p-datatable-sm">
    <div class="p-datatable-table-container" style="overflow: auto">
      <table role="table" class="p-datatable-table">
        <thead class="p-datatable-thead">
          <tr
            role="row"
            class="p-datatable-row"
            style="border-bottom: 2px solid #333"
          >
            <th
              class="p-datatable-header-cell"
              :style="{
                'border-top': 'none',
                'border-left': 'none',
                'border-bottom': '2px solid #333',
              }"
            ></th>
            <th
              v-for="cookie in cookiesStore.allCookies"
              :key="cookie.abbreviation"
              role="columnheader"
              class="p-datatable-header-cell"
              :style="{ 'border-bottom': '2px solid #333' }"
            >
              <strong>{{ cookie.abbreviation }}</strong>
            </th>
            <th
              class="p-datatable-header-cell"
              :style="{
                'border-top': 'none',
                'border-right': 'none',
                'border-bottom': '2px solid #333',
              }"
            ></th>
          </tr>
        </thead>
        <tbody class="p-datatable-tbody">
          <tr>
            <td
              rowspan="2"
              nowrap
              :style="{
                'border-left': '2px solid #333',
              }"
            >
              <strong>Direct Shipped</strong>
            </td>
            <td
              v-for="cookie in cookiesStore.allCookies"
              :key="cookie.abbreviation"
              role="cell"
              style="text-align: right"
            >
              {{
                (props.cookieSummary as CookieSummary).directShipped?.[
                  cookie.abbreviation
                ] || 0
              }}
            </td>
            <td
              role="cell"
              :style="{
                'border-right': '2px solid #333',
                'text-align': 'right',
              }"
            >
              {{
                (props.cookieSummary as CookieSummary).countDirectShipped || 0
              }}
            </td>
          </tr>
          <tr>
            <td
              v-for="cookie in cookiesStore.allCookies"
              :key="cookie.abbreviation"
              :style="{ 'text-align': 'right' }"
            >
              {{
                formatHelpers.formatCurrency(
                  (props.cookieSummary as CookieSummary).directShippedTotals?.[
                    cookie.abbreviation
                  ] || 0,
                )
              }}
            </td>
            <td
              :style="{
                'border-right': '2px solid #333',
                'text-align': 'right',
              }"
            >
              {{ formatHelpers.formatCurrency(0) }}
            </td>
          </tr>
          <tr>
            <td rowspan="2" :style="{ 'border-left': '2px solid #333' }">
              <strong>Booth Sales</strong>
            </td>
            <td
              v-for="cookie in cookiesStore.allCookies"
              :key="cookie.abbreviation"
              role="cell"
              :style="{ 'text-align': 'right' }"
            >
              {{
                (props.cookieSummary as CookieSummary).boothSales?.[
                  cookie.abbreviation
                ] || 0
              }}
            </td>
            <td
              :style="{
                'border-right': '2px solid #333',
                'text-align': 'right',
              }"
            >
              {{ (props.cookieSummary as CookieSummary).countBoothSales || 0 }}
            </td>
          </tr>
          <tr>
            <td
              v-for="cookie in cookiesStore.allCookies"
              :key="cookie.abbreviation"
              :style="{ 'text-align': 'right' }"
            >
              {{
                formatHelpers.formatCurrency(
                  (props.cookieSummary as CookieSummary).boothSalesTotals?.[
                    cookie.abbreviation
                  ] || 0,
                )
              }}
            </td>
            <td
              :style="{
                'border-right': '2px solid #333',
                'text-align': 'right',
              }"
            >
              {{ formatHelpers.formatCurrency(0) }}
            </td>
          </tr>
          <tr>
            <td rowspan="2" :style="{ 'border-left': '2px solid #333' }">
              <strong>Virtual Booth Sales</strong>
            </td>
            <td
              v-for="cookie in cookiesStore.allCookies"
              :key="cookie.abbreviation"
              role="cell"
              style="text-align: right"
            >
              {{
                (props.cookieSummary as CookieSummary).virtualBoothSales?.[
                  cookie.abbreviation
                ] || 0
              }}
            </td>
            <td
              :style="{
                'border-right': '2px solid #333',
                'text-align': 'right',
              }"
            >
              {{
                (props.cookieSummary as CookieSummary).countVirtualBoothSales ||
                0
              }}
            </td>
          </tr>
          <tr>
            <td
              v-for="cookie in cookiesStore.allCookies"
              :key="cookie.abbreviation"
              :style="{ 'text-align': 'right' }"
            >
              {{
                formatHelpers.formatCurrency(
                  (props.cookieSummary as CookieSummary)
                    .virtualBoothSalesTotals?.[cookie.abbreviation] || 0,
                )
              }}
            </td>
            <td
              :style="{
                'border-right': '2px solid #333',
                'text-align': 'right',
              }"
            >
              {{ formatHelpers.formatCurrency(0) }}
            </td>
          </tr>
          <tr>
            <td
              rowspan="2"
              :style="{
                'border-bottom': '2px solid #333',
                'border-left': '2px solid #333',
              }"
            >
              <strong>Girl Delivery</strong>
            </td>
            <td
              v-for="cookie in cookiesStore.allCookies"
              :key="cookie.abbreviation"
              role="cell"
              style="text-align: right"
            >
              {{
                (props.cookieSummary as CookieSummary).girlDelivery?.[
                  cookie.abbreviation
                ] || 0
              }}
            </td>
            <td
              :style="{
                'border-right': '2px solid #333',
                'text-align': 'right',
              }"
            >
              {{
                (props.cookieSummary as CookieSummary).countGirlDelivery || 0
              }}
            </td>
          </tr>
          <tr>
            <td
              v-for="cookie in cookiesStore.allCookies"
              :key="cookie.abbreviation"
              :style="{
                'border-bottom': '2px solid #333',
                'text-align': 'right',
              }"
            >
              {{
                formatHelpers.formatCurrency(
                  (props.cookieSummary as CookieSummary).girlDeliveryTotals?.[
                    cookie.abbreviation
                  ] || 0,
                )
              }}
            </td>
            <td
              :style="{
                'border-bottom': '2px solid #333',
                'border-right': '2px solid #333',
                'text-align': 'right',
              }"
            >
              {{
                formatHelpers.formatCurrency(
                  (props.cookieSummary as CookieSummary).totalDue || 0,
                )
              }}
            </td>
          </tr>
          <tr>
            <td
              :colspan="cookiesStore.allCookies.length - 1"
              :style="{ 'border-left': 'none', 'border-bottom': 'none' }"
            ></td>
            <td
              colspan="2"
              :style="{
                'border-left': '2px solid #333',
                'border-bottom': '2px solid #333',
              }"
            >
              <strong>Total # Packages</strong>
            </td>
            <td
              :style="{
                'border-left': '2px solid #333',
                'border-bottom': '2px solid #333',
                'border-right': '2px solid #333',
                'text-align': 'right',
              }"
            >
              {{ props.cookieSummary.countAllPackages }}
            </td>
          </tr>
          <tr>
            <td
              :colspan="cookiesStore.allCookies.length - 1"
              :style="{ 'border-left': 'none', 'border-bottom': 'none' }"
            ></td>
            <td
              colspan="2"
              :style="{
                'border-left': '2px solid #333',
                'border-bottom': '2px solid #333',
              }"
            >
              <strong>Total Due</strong>
            </td>
            <td
              :style="{
                'border-left': '2px solid #333',
                'border-bottom': '2px solid #333',
                'border-right': '2px solid #333',
                'text-align': 'right',
              }"
            >
              {{
                formatHelpers.formatCurrency(
                  (props.cookieSummary as CookieSummary).totalDue || 0,
                )
              }}
            </td>
          </tr>
          <tr>
            <td
              :colspan="cookiesStore.allCookies.length - 1"
              :style="{ 'border-left': 'none', 'border-bottom': 'none' }"
            ></td>
            <td
              colspan="2"
              :style="{
                'border-left': '2px solid #333',
                'border-bottom': '2px solid #333',
              }"
            >
              <strong>Payments</strong>
            </td>
            <td
              :style="{
                'border-left': '2px solid #333',
                'border-bottom': '2px solid #333',
                'border-right': '2px solid #333',
                'text-align': 'right',
              }"
            >
              {{ formatHelpers.formatCurrency(props.totalPayments || 0) }}
            </td>
          </tr>
          <tr>
            <td
              :colspan="cookiesStore.allCookies.length - 1"
              :style="{ 'border-left': 'none', 'border-bottom': 'none' }"
            ></td>
            <td
              colspan="2"
              :style="{
                'border-left': '2px solid #333',
                'border-bottom': '2px solid #333',
              }"
            >
              <strong>Still Due</strong>
            </td>
            <td
              :style="{
                'border-left': '2px solid #333',
                'border-bottom': '2px solid #333',
                'border-right': '2px solid #333',
                'text-align': 'right',
              }"
            >
              {{
                formatHelpers.formatCurrency(
                  (props.cookieSummary as CookieSummary).totalDue +
                    props.totalPayments || 0,
                )
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
