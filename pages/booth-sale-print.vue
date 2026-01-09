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
    return cookiesStore.allCookiesNotVirtual.map((cookie) => ({
      name: cookie.name,
      abbreviation: cookie.abbreviation,
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
      return girl
        ? `${girl.first_name} ${girl.last_name}`
        : 'Unknown Scout';
    });
  });
</script>

<template>
  <div class="print-report">
    <!-- Header -->
    <div class="report-header">
      <h4>Booth Sale Worksheet</h4>
    </div>

    <!-- Booth Sale Information -->
    <div class="mt-4">
      <table class="info-table">
        <tbody>
          <tr>
            <td><strong>Location:</strong></td>
            <td>{{ boothSale.location }}</td>
          </tr>
          <tr>
            <td><strong>Date:</strong></td>
            <td>
              <NuxtTime :datetime="boothSale.sale_date" time-zone="UTC" />
            </td>
          </tr>
          <tr>
            <td><strong>Time:</strong></td>
            <td>{{ boothSale.sale_time || 'N/A' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cookies Predicted/Sales Section -->
    <div class="mt-6">
      <h5 class="section-title">Cookie Sales</h5>
      <table class="sales-table">
        <thead>
          <tr>
            <th>Cookie Variety</th>
            <th>Predicted</th>
            <th>Actual Sales</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cookie in cookiesList" :key="cookie.abbreviation">
            <td>{{ cookie.name }}</td>
            <td class="text-center">{{ cookie.predicted }}</td>
            <td class="fill-in-cell" />
            <td class="fill-in-cell" />
          </tr>
          <tr class="total-row">
            <td><strong>Total Packages</strong></td>
            <td class="text-center">
              <strong>{{
                cookiesList.reduce((sum, c) => sum + c.predicted, 0)
              }}</strong>
            </td>
            <td class="fill-in-cell" />
            <td class="fill-in-cell" />
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Girls Assigned Section -->
    <div class="mt-6">
      <h5 class="section-title">Scouts Assigned to This Sale</h5>
      <ul class="scout-list">
        <li v-for="(name, index) in girlNames" :key="index">{{ name }}</li>
        <li v-if="girlNames.length === 0" class="empty-message">
          No scouts assigned
        </li>
      </ul>
    </div>

    <!-- Adults on Duty Section -->
    <div class="mt-6">
      <h5 class="section-title">Adults on Duty</h5>
      <div class="fill-in-lines">
        <div class="line-item">1. _______________________________</div>
        <div class="line-item">2. _______________________________</div>
        <div class="line-item">3. _______________________________</div>
        <div class="line-item">4. _______________________________</div>
      </div>
    </div>

    <!-- Receipt Signature Section -->
    <div class="mt-6">
      <h5 class="section-title">Cookie Receipt Acknowledgment</h5>
      <p class="acknowledgment-text">
        I acknowledge receipt of the cookies checked out for this booth sale and
        agree to return all unsold cookies and payments to the troop leader.
      </p>
      <div class="signature-section">
        <div class="signature-line">
          <div class="line">_______________________________</div>
          <div class="label">Volunteer Signature</div>
        </div>
        <div class="signature-line">
          <div class="line">_______________________________</div>
          <div class="label">Date</div>
        </div>
      </div>
    </div>

    <!-- Payment Tracking Section -->
    <div class="mt-6">
      <h5 class="section-title">Payment Collection</h5>

      <!-- Cash Section -->
      <div class="payment-subsection">
        <h6 class="subsection-title">Cash Received</h6>
        <table class="payment-table">
          <tbody>
            <tr>
              <td>$1 Bills:</td>
              <td class="fill-in-small">_______</td>
              <td class="spacer">×</td>
              <td>$1</td>
              <td class="spacer">=</td>
              <td class="fill-in-small">$_______</td>
            </tr>
            <tr>
              <td>$5 Bills:</td>
              <td class="fill-in-small">_______</td>
              <td class="spacer">×</td>
              <td>$5</td>
              <td class="spacer">=</td>
              <td class="fill-in-small">$_______</td>
            </tr>
            <tr>
              <td>$10 Bills:</td>
              <td class="fill-in-small">_______</td>
              <td class="spacer">×</td>
              <td>$10</td>
              <td class="spacer">=</td>
              <td class="fill-in-small">$_______</td>
            </tr>
            <tr>
              <td>$20 Bills:</td>
              <td class="fill-in-small">_______</td>
              <td class="spacer">×</td>
              <td>$20</td>
              <td class="spacer">=</td>
              <td class="fill-in-small">$_______</td>
            </tr>
            <tr>
              <td>$50 Bills:</td>
              <td class="fill-in-small">_______</td>
              <td class="spacer">×</td>
              <td>$50</td>
              <td class="spacer">=</td>
              <td class="fill-in-small">$_______</td>
            </tr>
            <tr>
              <td>$100 Bills:</td>
              <td class="fill-in-small">_______</td>
              <td class="spacer">×</td>
              <td>$100</td>
              <td class="spacer">=</td>
              <td class="fill-in-small">$_______</td>
            </tr>
            <tr>
              <td>Coins:</td>
              <td colspan="4" />
              <td class="fill-in-small">$_______</td>
            </tr>
            <tr class="total-row">
              <td colspan="5"><strong>Total Cash:</strong></td>
              <td class="fill-in-small"><strong>$_______</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Credit Card Section -->
      <div class="payment-subsection mt-4">
        <h6 class="subsection-title">Credit Card Transactions</h6>
        <table class="payment-table">
          <tbody>
            <tr>
              <td><strong>Total Credit Card Receipts:</strong></td>
              <td class="fill-in-medium">$_______________________</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Other Payment Section -->
      <div class="payment-subsection mt-4">
        <h6 class="subsection-title">Other Forms of Payment</h6>
        <table class="payment-table">
          <tbody>
            <tr>
              <td><strong>Other (Venmo, Check, etc.):</strong></td>
              <td class="fill-in-medium">$_______________________</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Grand Total -->
      <div class="payment-subsection mt-4">
        <table class="payment-table">
          <tbody>
            <tr class="total-row">
              <td><strong>TOTAL RECEIPTS:</strong></td>
              <td class="fill-in-medium"><strong>$_______________________</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Notes Section -->
    <div class="mt-6">
      <h5 class="section-title">Notes</h5>
      <div class="notes-area">
        <div class="note-line">_______________________________________________</div>
        <div class="note-line">_______________________________________________</div>
        <div class="note-line">_______________________________________________</div>
        <div class="note-line">_______________________________________________</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .print-report {
    font-family: Arial, sans-serif;
    color: #333;
  }

  .report-header {
    text-align: center;
    border-bottom: 2px solid #333;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }

  .report-header h4 {
    font-size: 24pt;
    margin: 0;
    font-weight: bold;
  }

  .info-table {
    width: 100%;
    max-width: 500px;
  }

  .info-table td {
    padding: 0.25rem 0;
  }

  .info-table td:first-child {
    width: 100px;
  }

  .section-title {
    font-size: 14pt;
    font-weight: bold;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid #999;
    padding-bottom: 0.25rem;
  }

  .subsection-title {
    font-size: 12pt;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .sales-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 0.5rem;
  }

  .sales-table th,
  .sales-table td {
    border: 1px solid #333;
    padding: 0.5rem;
  }

  .sales-table th {
    background-color: #f0f0f0;
    font-weight: bold;
    text-align: center;
  }

  .sales-table .text-center {
    text-align: center;
  }

  .sales-table .fill-in-cell {
    background-color: #f9f9f9;
    min-width: 80px;
  }

  .sales-table .total-row {
    background-color: #e8e8e8;
  }

  .scout-list {
    list-style-type: none;
    padding: 0;
    margin: 0.5rem 0;
  }

  .scout-list li {
    padding: 0.25rem 0;
    font-size: 11pt;
  }

  .empty-message {
    font-style: italic;
    color: #666;
  }

  .fill-in-lines {
    margin-top: 0.5rem;
  }

  .line-item {
    margin: 0.5rem 0;
    font-size: 11pt;
  }

  .acknowledgment-text {
    font-size: 10pt;
    margin: 0.5rem 0;
    line-height: 1.4;
  }

  .signature-section {
    display: flex;
    gap: 2rem;
    margin-top: 2rem;
  }

  .signature-line {
    flex: 1;
  }

  .signature-line .line {
    border-bottom: 1px solid #333;
    min-width: 200px;
    height: 30px;
  }

  .signature-line .label {
    font-size: 9pt;
    margin-top: 0.25rem;
    text-align: center;
  }

  .payment-subsection {
    margin-top: 1rem;
  }

  .payment-table {
    width: 100%;
    max-width: 600px;
  }

  .payment-table td {
    padding: 0.25rem 0.5rem;
  }

  .payment-table .fill-in-small {
    border-bottom: 1px solid #333;
    text-align: right;
    min-width: 80px;
  }

  .payment-table .fill-in-medium {
    border-bottom: 1px solid #333;
    text-align: right;
    min-width: 150px;
  }

  .payment-table .spacer {
    text-align: center;
    padding: 0 0.5rem;
  }

  .payment-table .total-row {
    font-weight: bold;
    border-top: 2px solid #333;
    padding-top: 0.5rem;
  }

  .notes-area {
    margin-top: 0.5rem;
  }

  .note-line {
    margin: 0.75rem 0;
    font-size: 11pt;
  }

  @media print {
    .print-report {
      padding: 0;
    }

    .sales-table th,
    .sales-table .fill-in-cell,
    .sales-table .total-row {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .sales-table th {
      background-color: #f0f0f0 !important;
    }

    .sales-table .fill-in-cell {
      background-color: #f9f9f9 !important;
    }

    .sales-table .total-row {
      background-color: #e8e8e8 !important;
    }
  }
</style>
