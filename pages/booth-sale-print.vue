<script setup lang="ts">
  definePageMeta({
    layout: 'print',
  });

  const boothsStore = useBoothsStore();
  const cookiesStore = useCookiesStore();
  const girlsStore = useGirlsStore();
  const route = useRoute();

  // Safely parse boothSaleId query
  const rawBoothSaleId = route.query?.boothSaleId;
  let boothSaleId: number | null = null;
  if (rawBoothSaleId) {
    const first = Array.isArray(rawBoothSaleId)
      ? rawBoothSaleId[0]
      : rawBoothSaleId;
    if (typeof first === 'string') {
      const parsed = parseInt(first, 10);
      boothSaleId = Number.isNaN(parsed) ? null : parsed;
    }
  }

  // Find the booth sale
  const boothSale = computed(() => {
    return (
      (boothSaleId !== null
        ? boothsStore.allBoothSales.find((sale) => sale.id === boothSaleId)
        : undefined) || {
        id: 0,
        location: '',
        sale_date: '',
        sale_time: '',
        scouts_attending: null,
        predicted_cookies: null,
        expected_sales: 0,
        notes: '',
      }
    );
  });

  // Get cookies from predicted_cookies
  const cookiesList = computed(() => {
    const predictedCookies = boothSale.value.predicted_cookies || {};
    // Handle predicted_cookies which is stored as Json (Record<string, unknown>)
    const cookiesMap =
      typeof predictedCookies === 'object' && predictedCookies !== null
        ? (predictedCookies as Record<string, unknown>)
        : {};
    return cookiesStore.allCookies.map((cookie) => ({
      id: cookie.id,
      name: cookie.name,
      abbreviation: cookie.abbreviation,
      is_virtual: cookie.is_virtual,
      predicted: Number(cookiesMap[cookie.abbreviation]) || 0,
    }));
  });

  // Get girl names
  const girlNames = computed(() => {
    const scoutsAttending = boothSale.value.scouts_attending;
    if (!scoutsAttending || !Array.isArray(scoutsAttending)) {
      return [];
    }
    return (scoutsAttending as number[]).map((girlId: number) => {
      const girl = girlsStore.getGirlById(girlId);
      return girl ? `${girl.first_name} ${girl.last_name}` : 'Unknown Scout';
    });
  });
</script>

<template>
  <div>
    <!-- Header -->
    <div>
      <h4 class="text-center">Booth Inventory Worksheet</h4>
    </div>

    <!-- Booth Sale Information -->
    <div class="grid grid-cols-3 gap-4">
      <div class="border-b-1 border-gray-400 pb-2">
        <strong>Location:</strong> {{ boothSale.location }}
      </div>
      <div class="border-b-1 border-gray-400 pb-2">
        <strong>Date:</strong>
        <NuxtTime :datetime="boothSale.sale_date" time-zone="UTC" />
      </div>
      <div class="border-b-1 border-gray-400 pb-2">
        <strong>Time:</strong> {{ boothSale.sale_time || 'N/A' }}
      </div>
    </div>

    <!-- Cookies Predicted/Sales Section -->
    <div class="mt-2">
      <div class="p-datatable-table-container" style="overflow: auto">
        <table role="table" class="p-datatable-table print-table">
          <thead class="p-datatable-thead">
            <tr
              role="row"
              class="p-datatable-row"
              style="border-bottom: 2px solid #444"
            >
              <th
                class="p-datatable-header-cell"
                :style="{
                  'border-top': 'none',
                  'border-left': 'none',
                  'border-bottom': '2px solid #444',
                }"
              />
              <th
                v-for="cookie in cookiesList"
                :key="cookie.abbreviation"
                role="columnheader"
                class="p-datatable-header-cell"
                :style="{ 'border-bottom': '2px solid #444' }"
              >
                <strong>{{ cookie.abbreviation }}</strong>
              </th>
              <th
                role="columnheader"
                class="p-datatable-header-cell"
                :style="{ 'border-bottom': '2px solid #444' }"
              >
                <strong>Total</strong>
              </th>
            </tr>
          </thead>
          <tbody class="p-datatable-tbody">
            <tr>
              <td
                :style="{
                  'border-left': '2px solid #444',
                  'border-bottom': '2px solid #444',
                }"
              >
                <strong>Starting Inventory</strong>
              </td>
              <td
                v-for="cookie in cookiesList"
                :key="cookie.abbreviation"
                role="cell"
                :style="{
                  'border-bottom': '2px solid #444',
                  'border-left': '1px solid rgb(226, 232, 240)',
                }"
              >
                {{ cookie.predicted }}
              </td>
              <td
                role="cell"
                :style="{
                  'border-right': '2px solid #444',
                  'text-align': 'right',
                  'border-bottom': '2px solid #444',
                  'border-left': '1px solid rgb(226, 232, 240)',
                }"
              >
                {{ cookiesList.reduce((sum, c) => sum + c.predicted, 0) }}
              </td>
            </tr>
            <tr style="height: 75px">
              <td
                :style="{
                  'border-left': '2px solid #444',
                }"
              >
                <strong>Packages Sold</strong> <br />
                (use tally marks
                <span class="tally-five">||||</span>)
              </td>
              <td
                v-for="cookie in cookiesList"
                :key="cookie.abbreviation"
                role="cell"
                :style="{
                  'border-left': '1px solid rgb(226, 232, 240)',
                }"
              />
              <td
                role="cell"
                :style="{
                  'border-right': '2px solid #444',
                  'text-align': 'right',
                  'border-left': '1px solid rgb(226, 232, 240)',
                }"
              />
            </tr>
            <tr>
              <td
                :style="{
                  'border-left': '2px solid #444',
                  'border-bottom': '2px solid #444',
                }"
              >
                Total
              </td>
              <td
                v-for="cookie in cookiesList"
                :key="cookie.abbreviation"
                role="cell"
                :style="{
                  'border-bottom': '2px solid #444',
                  'border-left': '1px solid rgb(226, 232, 240)',
                }"
              />
              <td
                role="cell"
                :style="{
                  'border-right': '2px solid #444',
                  'text-align': 'right',
                  'border-bottom': '2px solid #444',
                  'border-left': '1px solid rgb(226, 232, 240)',
                }"
              ></td>
            </tr>
            <tr>
              <td
                :style="{
                  'border-left': '2px solid #444',
                  'border-bottom': '2px solid #444',
                }"
              >
                <strong>Ending Inventory</strong>
              </td>
              <td
                v-for="cookie in cookiesList"
                :key="cookie.abbreviation"
                role="cell"
                :style="{
                  'border-left': '1px solid rgb(226, 232, 240)',
                  'border-bottom': '2px solid #444',
                }"
              ></td>
              <td
                role="cell"
                :style="{
                  'border-right': '2px solid #444',
                  'text-align': 'right',
                  'border-bottom': '2px solid #444',
                  'border-left': '1px solid rgb(226, 232, 240)',
                }"
              ></td>
            </tr>
            <tr>
              <td
                :style="{
                  'border-left': '2px solid #444',
                  'border-bottom': '2px solid #444',
                  'max-width': '150px',
                }"
              >
                <strong>Total Packages Sold</strong><br />
                (subtract ending inventory from starting inventory)
              </td>
              <td
                v-for="cookie in cookiesList"
                :key="cookie.abbreviation"
                role="cell"
                :style="{
                  'border-left': '1px solid rgb(226, 232, 240)',
                  'border-bottom': '2px solid #444',
                }"
              ></td>
              <td
                role="cell"
                :style="{
                  'border-right': '2px solid #444',
                  'text-align': 'right',
                  'border-bottom': '2px solid #444',
                  'border-left': '1px solid rgb(226, 232, 240)',
                }"
              ></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Girls Assigned Section -->
    <div class="grid grid-cols-2 gap-6 mt-2">
      <div>
        <div><strong>Scout(s) Assigned</strong></div>
        <div v-if="girlNames.length > 0">
          <div
            class="border-b border-gray-400 pt-3"
            v-for="index in 4"
            :key="index"
          >
            {{ index }}. {{ girlNames[index - 1] || '' }}
          </div>
        </div>
        <div v-else>
          <div class="border-b border-gray-400 pt-3">1.</div>
          <div class="border-b border-gray-400 pt-3">2.</div>
          <div class="border-b border-gray-400 pt-3">3.</div>
          <div class="border-b border-gray-400 pt-3">4.</div>
        </div>
      </div>

      <!-- Adults on Duty Section -->
      <div>
        <div><strong>Adults Supervisor(s)</strong></div>
        <div>
          <div class="border-b border-gray-400 pt-3">1.</div>
          <div class="border-b border-gray-400 pt-3">2.</div>
          <div class="border-b border-gray-400 pt-3">3.</div>
          <div class="border-b border-gray-400 pt-3">4.</div>
        </div>
      </div>
    </div>

    <div class="mt-2">
      <div class="p-datatable-table-container" style="overflow: auto">
        <table role="table" class="p-datatable-table print-table">
          <thead class="p-datatable-thead">
            <tr
              role="row"
              class="p-datatable-row"
              style="border-bottom: 2px solid #444"
            >
              <th
                class="p-datatable-header-cell"
                :style="{
                  'border-top': 'none',
                  'border-left': 'none',
                  'border-bottom': '2px solid #444',
                }"
              ></th>
              <th
                role="columnheader"
                class="p-datatable-header-cell"
                :style="{ 'border-bottom': '2px solid #444' }"
              >
                <strong>$1</strong>
              </th>
              <th
                role="columnheader"
                class="p-datatable-header-cell"
                :style="{ 'border-bottom': '2px solid #444' }"
              >
                <strong>$5</strong>
              </th>
              <th
                role="columnheader"
                class="p-datatable-header-cell"
                :style="{ 'border-bottom': '2px solid #444' }"
              >
                <strong>$10</strong>
              </th>
              <th
                role="columnheader"
                class="p-datatable-header-cell"
                :style="{ 'border-bottom': '2px solid #444' }"
              >
                <strong>$20</strong>
              </th>
              <th
                role="columnheader"
                class="p-datatable-header-cell"
                :style="{ 'border-bottom': '2px solid #444' }"
              >
                <strong>$50</strong>
              </th>
              <th
                role="columnheader"
                class="p-datatable-header-cell"
                :style="{ 'border-bottom': '2px solid #444' }"
              >
                <strong>$100</strong>
              </th>
              <th
                role="columnheader"
                class="p-datatable-header-cell"
                :style="{ 'border-bottom': '2px solid #444' }"
              >
                <strong>Cents</strong>
              </th>
            </tr>
          </thead>
          <tbody class="p-datatable-tbody">
            <tr>
              <td
                :style="{
                  'border-left': '2px solid #444',
                }"
              >
                <strong># Bills</strong>
              </td>
              <td
                v-for="denom in [1, 5, 10, 20, 50, 100]"
                :key="denom"
                role="cell"
                :style="{
                  'border-left': '1px solid rgb(226, 232, 240)',
                }"
              >
                #
              </td>
              <td
                role="cell"
                :style="{
                  'border-right': '2px solid #444',
                  'border-left': '1px solid rgb(226, 232, 240)',
                  'background-color': 'rgb(226, 232, 240)',
                }"
              ></td>
            </tr>
            <tr>
              <td
                :style="{
                  'border-left': '2px solid #444',
                  'border-bottom': '2px solid #444',
                }"
              >
                <strong>Total</strong> (# Bills * $)
              </td>
              <td
                v-for="denom in [1, 5, 10, 20, 50, 100]"
                :key="denom"
                role="cell"
                :style="{
                  'border-bottom': '2px solid #444',
                  'border-left': '1px solid rgb(226, 232, 240)',
                }"
              >
                $
              </td>
              <td
                role="cell"
                :style="{
                  'border-right': '2px solid #444',
                  'border-bottom': '2px solid #444',
                  'border-left': '1px solid rgb(226, 232, 240)',
                }"
              >
                $
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6 mt-4">
      <div class="p-datatable-table-container" style="overflow: auto">
        <table role="table" class="p-datatable-table print-table">
          <tbody class="p-datatable-tbody">
            <tr>
              <td
                :style="{
                  'border-left': '2px solid #444',
                  'border-top': '2px solid #444',
                }"
              >
                <strong>Ending Cash</strong>
              </td>
              <td
                role="cell"
                :style="{
                  'border-left': '1px solid rgb(226, 232, 240)',
                  'border-top': '2px solid #444',
                  'border-right': '2px solid #444',
                  'min-width': '75px',
                }"
              >
                $
              </td>
            </tr>
            <tr>
              <td
                :style="{
                  'border-left': '2px solid #444',
                }"
                class="flex justify-between items-center"
              >
                <strong>Starting Cash</strong>
                <span>&#8722;</span>
              </td>
              <td
                role="cell"
                :style="{
                  'border-left': '1px solid rgb(226, 232, 240)',
                  'border-right': '2px solid #444',
                }"
              >
                $
              </td>
            </tr>
            <tr>
              <td
                :style="{
                  'border-left': '2px solid #444',
                  'background-color': 'rgb(226, 232, 240)',
                }"
                class="flex justify-between items-center"
              >
                <strong>Total Cash Collected</strong>
                <span>&#61;</span>
              </td>
              <td
                role="cell"
                :style="{
                  'border-left': '1px solid rgb(226, 232, 240)',
                  'border-right': '2px solid #444',
                }"
              >
                $
              </td>
            </tr>
            <tr>
              <td
                :style="{
                  'border-left': '2px solid #444',
                }"
                class="flex justify-between items-center"
              >
                <strong>Credit Cards</strong>
                <span>&#43;</span>
              </td>
              <td
                role="cell"
                :style="{
                  'border-left': '1px solid rgb(226, 232, 240)',
                  'border-right': '2px solid #444',
                }"
              >
                $
              </td>
            </tr>
            <tr>
              <td
                :style="{
                  'border-left': '2px solid #444',
                }"
                class="flex justify-between items-center"
              >
                <span
                  ><strong>Other Payments</strong> (Check, Payment Apps,
                  etc.)</span
                >
                <span>&#43;</span>
              </td>
              <td
                role="cell"
                :style="{
                  'border-left': '1px solid rgb(226, 232, 240)',
                  'border-right': '2px solid #444',
                }"
              >
                $
              </td>
            </tr>
            <tr>
              <td
                :style="{
                  'border-left': '2px solid #444',
                  'border-bottom': '2px solid #444',
                  'background-color': 'rgb(226, 232, 240)',
                }"
                class="flex justify-between items-center"
              >
                <strong>Total Collected</strong>
                <span>&#61;</span>
              </td>
              <td
                role="cell"
                :style="{
                  'border-left': '1px solid rgb(226, 232, 240)',
                  'border-right': '2px solid #444',
                  'border-bottom': '2px solid #444',
                }"
              >
                $
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <h5>Notes</h5>
        <div>
          <div class="border-b border-gray-400 pt-8"></div>
          <div class="border-b border-gray-400 pt-8"></div>
          <div class="border-b border-gray-400 pt-8"></div>
          <div class="border-b border-gray-400 pt-8"></div>
          <div class="border-b border-gray-400 pt-8"></div>
          <div class="border-b border-gray-400 pt-8"></div>
        </div>
      </div>
    </div>

    <!-- Receipt Signature Section -->
    <div class="grid grid-cols-2 gap-6 mt-6">
      <div>
        <div>
          <div>
            <div class="border-b border-gray-400 pt-6"></div>
            <div>Received By</div>
          </div>
          <div>
            <div class="border-b border-gray-400 pt-6"></div>
            <div>Date</div>
          </div>
        </div>
      </div>
      <div>
        <div>
          <div>
            <div class="border-b border-gray-400 pt-6"></div>
            <div>Received From</div>
          </div>
          <div>
            <div class="border-b border-gray-400 pt-6"></div>
            <div>Date</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
  .tally-five {
    display: inline-block;
    text-decoration: line-through;
    /* This creates the diagonal slash for the fifth mark */
  }
</style>
