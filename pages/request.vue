<script setup lang="ts">
  import { useFormKitNodeById } from '@formkit/vue';
  import type { Database } from '@/types/supabase';

  definePageMeta({
    layout: 'login',
  });

  type SellerRequest = {
    id: number;
    first_name: string;
    season: number;
  };

  type Cookie = Database['public']['Tables']['cookies']['Row'];

  const route = useRoute();
  const supabaseClient = useSupabaseClient<Database>();
  const notificationHelpers = useNotificationHelpers();

  const sellerId = ref<number | null>(null);
  const sellerInfo = ref<SellerRequest | null>(null);
  const cookies = ref<Cookie[]>([]);
  const loading = ref(true);
  const requestSubmitted = ref(false);
  const activeRequest = ref<{
    type: string;
    status: string;
    auto_calculate_cookies: boolean;
    to?: number;
    season?: number;
    order_date?: Date | string;
    cookies?: Record<string, number>;
    notes?: string;
  }>({
    type: 'T2G',
    status: 'requested',
    auto_calculate_cookies: false,
  });

  const formNode = useFormKitNodeById('request-form');

  // Validate and fetch seller info on mount
  onMounted(async () => {
    const id = route.query.id;

    // Redirect to login if no id provided
    if (!id) {
      await navigateTo('/login');
      return;
    }

    try {
      sellerId.value = parseInt(id as string);

      // Fetch seller info from seller_requests view
      const { data: sellerData, error: sellerError } = await supabaseClient
        .from('seller_requests')
        .select('*')
        .eq('id', sellerId.value)
        .single();

      if (sellerError || !sellerData) {
        // Seller not found or not in published season, redirect to login
        await navigateTo('/login');
        return;
      }

      sellerInfo.value = sellerData;

      // Fetch cookies for this season
      const { data: cookiesData, error: cookiesError } = await supabaseClient
        .from('cookies')
        .select('*')
        .eq('season', sellerInfo.value.season)
        .order('order');

      if (cookiesError) {
        throw cookiesError;
      }

      cookies.value = cookiesData || [];

      // Set the "to" and "season" fields for the request
      activeRequest.value.to = sellerId.value ?? undefined;
      activeRequest.value.season = sellerInfo.value.season;

      loading.value = false;
    } catch (error) {
      console.error('Error loading request form:', error);
      notificationHelpers.addError(error as Error);
      await navigateTo('/login');
    }
  });

  const submitButtonClickHandler = () => {
    if (formNode.value) formNode.value.submit();
  };

  async function submitRequest() {
    try {
      // Ensure we have required data
      if (!sellerId.value || !sellerInfo.value?.season) {
        throw new Error('Missing required information');
      }

      // Create the order with status 'requested'
      const orderData = {
        type: 'T2G',
        status: 'requested',
        to: sellerId.value,
        season: sellerInfo.value.season,
        order_date: activeRequest.value.order_date,
        cookies: activeRequest.value.cookies,
        notes: activeRequest.value.notes,
        profile: null, // Public request, no profile
      };

      const { error } = await supabaseClient.from('orders').insert(orderData);

      if (error) throw error;

      requestSubmitted.value = true;
      notificationHelpers.addSuccess('Cookie request submitted successfully!');

      // Reset form
      activeRequest.value = {
        type: 'T2G',
        status: 'requested',
        auto_calculate_cookies: false,
        to: sellerId.value ?? undefined,
        season: sellerInfo.value.season,
      };
    } catch (error) {
      console.error('Error submitting request:', error);
      notificationHelpers.addError(error as Error);
    }
  }

  // Build form schema dynamically based on cookies
  const requestFormSchema = computed(() => {
    if (!cookies.value.length) return [];

    const cookieFields = cookies.value.map((cookie) => ({
      $formkit: 'primeInputNumber',
      name: cookie.abbreviation,
      label: cookie.name,
      placeholder: '0',
      validation: 'integer|min:0',
      min: 0,
    }));

    return [
      {
        $formkit: 'primeDatePicker',
        name: 'order_date',
        label: 'Date Needed',
        placeholder: 'Select date',
        'date-format': 'mm/dd/yy',
        validation: 'required|date',
        class: 'w-full',
      },
      {
        $el: 'div',
        attrs: {
          class: 'text-md font-bold mt-4 mb-2',
        },
        children: 'Cookies Requested',
      },
      {
        $formkit: 'group',
        name: 'cookies',
        children: cookieFields,
      },
      {
        $formkit: 'primeTextarea',
        name: 'notes',
        label: 'Notes (optional)',
        placeholder: 'Any additional notes about this request',
        class: 'w-full',
        rows: 3,
      },
    ];
  });
</script>

<template>
  <div
    class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden"
  >
    <div class="flex flex-col items-center justify-center p-4">
      <div
        style="
          border-radius: 56px;
          padding: 0.3rem;
          background: linear-gradient(
            180deg,
            var(--primary-color) 10%,
            rgba(33, 150, 243, 0) 30%
          );
        "
      >
        <div
          class="w-full bg-surface-0 dark:bg-surface-900 py-8 px-8 sm:px-12"
          style="border-radius: 53px; max-width: 600px"
        >
          <div class="text-center mb-8">
            <div
              class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4"
            >
              Cookie Request Form
            </div>
            <span
              v-if="!loading && sellerInfo"
              class="text-muted-color font-medium"
            >
              Request form for {{ sellerInfo.first_name }}
            </span>
            <span v-if="loading" class="text-muted-color font-medium">
              Loading...
            </span>
          </div>

          <div v-if="requestSubmitted" class="text-center">
            <i class="pi pi-check-circle text-4xl text-green-500 mb-4" />
            <p class="text-xl font-bold mb-2">Request Submitted!</p>
            <p class="text-muted-color mb-4">
              Your cookie request has been submitted successfully.
            </p>
            <Button
              label="Submit Another Request"
              icon="pi pi-plus"
              @click="requestSubmitted = false"
            />
          </div>

          <div v-else-if="!loading && sellerInfo">
            <FormKit
              id="request-form"
              v-model="activeRequest"
              type="form"
              :actions="false"
              @submit="submitRequest"
            >
              <FormKitSchema :schema="requestFormSchema" />
            </FormKit>

            <div class="flex justify-end gap-2 mt-6">
              <Button
                label="Submit Request"
                icon="pi pi-check"
                @click="submitButtonClickHandler"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <Toast />
  </div>
</template>
