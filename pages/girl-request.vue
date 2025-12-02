<script setup lang="ts">
  import { useFormKitNodeById } from '@formkit/vue';
  import type { NewOrder, Season, Girl } from '@/types/types';

  definePageMeta({
    layout: 'login',
  });

  const supabaseClient = useSupabaseClient();
  const route = useRoute();
  const notificationHelpers = useNotificationHelpers();
  const cookiesStore = useCookiesStore();

  // Form state
  const passwordInput = ref('');
  const isAuthenticated = ref(false);
  const isLoading = ref(true);
  const season = ref<Season | null>(null);
  const girls = ref<Girl[]>([]);
  const formData = ref<Partial<NewOrder>>({
    type: 'T2G',
    status: 'requested',
    auto_calculate_cookies: false,
    total_cookies: 0,
    cookies: {},
  });

  const formNode = useFormKitNodeById('girl-request-form');

  // Get season ID from query parameter
  const seasonId = computed(() => {
    const id = route.query.season;
    return id ? Number(id) : null;
  });

  // Load season and check if form is published
  onMounted(async () => {
    if (!seasonId.value) {
      notificationHelpers.addError({
        message: 'Season ID is required',
      } as Error);
      isLoading.value = false;
      return;
    }

    try {
      // Fetch season details
      const { data: seasonData, error: seasonError } = await supabaseClient
        .from('seasons')
        .select('*')
        .eq('id', seasonId.value)
        .single();

      if (seasonError) throw seasonError;
      season.value = seasonData;

      // Check if form is published
      if (!season.value?.publish_girl_request_form) {
        notificationHelpers.addError({
          message: 'Girl request form is not currently available',
        } as Error);
        isLoading.value = false;
        return;
      }

      // Check if password is required
      if (season.value.girl_request_form_password) {
        // If password is already provided in query, validate it
        const queryPassword = route.query.password;
        if (
          queryPassword &&
          queryPassword === season.value.girl_request_form_password
        ) {
          isAuthenticated.value = true;
        }
      } else {
        // No password required
        isAuthenticated.value = true;
      }

      // Load girls for this season
      const { data: girlsData, error: girlsError } = await supabaseClient
        .from('sellers')
        .select('*')
        .eq('season', seasonId.value);

      if (girlsError) throw girlsError;
      girls.value = girlsData || [];

      // Load cookies for this season
      await cookiesStore.fetchCookies(seasonId.value);
    } catch (error) {
      notificationHelpers.addError(error as Error);
    } finally {
      isLoading.value = false;
    }
  });

  const girlOptions = computed(() => {
    return girls.value.map((girl) => ({
      label: `${girl.first_name} ${girl.last_name}`,
      value: girl.id,
    }));
  });

  function checkPassword() {
    if (passwordInput.value === season.value?.girl_request_form_password) {
      isAuthenticated.value = true;
      notificationHelpers.addSuccess('Access granted');
    } else {
      notificationHelpers.addError({
        message: 'Incorrect password',
      } as Error);
    }
  }

  async function submitRequest() {
    if (!formNode.value) return;

    if (!seasonId.value) {
      notificationHelpers.addError({
        message: 'Season ID is required',
      } as Error);
      return;
    }

    if (!season.value) {
      notificationHelpers.addError({
        message: 'Season data not loaded',
      } as Error);
      return;
    }

    try {
      const requestData: NewOrder = {
        type: 'T2G',
        to: formData.value.to,
        status: 'requested',
        order_date: new Date().toISOString().split('T')[0],
        season: seasonId.value,
        profile: season.value.profile,
        cookies: formData.value.cookies,
        notes: formData.value.notes || 'Submitted via Girl Request Form',
      };

      const { error } = await supabaseClient.from('orders').insert(requestData);

      if (error) throw error;

      notificationHelpers.addSuccess(
        'Your cookie request has been submitted successfully!',
      );

      // Reset form
      formData.value = {
        type: 'T2G',
        status: 'requested',
        auto_calculate_cookies: false,
        total_cookies: 0,
        cookies: {},
        to: undefined,
        notes: '',
      };
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  }

  const submitButtonClickHandler = () => {
    if (formNode.value) formNode.value.submit();
  };

  const girlRequestFormSchema = computed(() => {
    return [
      {
        $formkit: 'primeSelect',
        name: 'to',
        label: 'Select Your Name',
        placeholder: 'Choose your name',
        options: girlOptions.value,
        validation: 'required',
        wrapperClass: 'mb-4',
        class: 'w-full',
        'option-label': 'label',
        'option-value': 'value',
      },
      {
        $el: 'div',
        attrs: {
          class: 'text-md font-semibold mb-2',
        },
        children: 'Cookies Requested',
      },
      {
        $formkit: 'group',
        name: 'cookies',
        children: cookiesStore.cookieFormFields,
      },
      {
        $formkit: 'primeTextarea',
        name: 'notes',
        label: 'Notes (optional)',
        placeholder: 'Add any notes about your request',
        class: 'w-full',
        rows: 3,
      },
    ];
  });
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <Card>
        <template #title>
          <div class="text-center mb-4">
            <h2 class="text-3xl font-bold">Girl Cookie Request Form</h2>
            <p v-if="season" class="text-surface-500 mt-2">
              Troop {{ season.troop_number }} - {{ season.year }}
            </p>
          </div>
        </template>

        <template #content>
          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-8">
            <ProgressSpinner />
            <p class="mt-4">Loading form...</p>
          </div>

          <!-- Password Check -->
          <div
            v-else-if="
              !isAuthenticated &&
              season?.girl_request_form_password &&
              season?.publish_girl_request_form
            "
            class="flex flex-col gap-4"
          >
            <Message severity="info">
              This form is password protected. Please enter the password to
              continue.
            </Message>
            <div class="flex gap-2">
              <InputText
                v-model="passwordInput"
                type="password"
                placeholder="Enter password"
                class="flex-1"
                @keyup.enter="checkPassword"
              />
              <Button
                label="Submit"
                icon="pi pi-check"
                @click="checkPassword"
              />
            </div>
          </div>

          <!-- Form not published -->
          <div
            v-else-if="!season?.publish_girl_request_form && !isLoading"
            class="text-center py-8"
          >
            <Message severity="warn">
              The girl request form is not currently available.
            </Message>
          </div>

          <!-- Main Form -->
          <div v-else-if="isAuthenticated">
            <Message severity="info" class="mb-4">
              Use this form to request cookies from your troop. Your request
              will be reviewed by your troop leaders.
            </Message>

            <FormKit
              id="girl-request-form"
              v-model="formData"
              type="form"
              :actions="false"
              @submit="submitRequest"
            >
              <FormKitSchema :schema="girlRequestFormSchema" />
            </FormKit>

            <div class="flex justify-end gap-2 mt-6">
              <Button
                label="Submit Request"
                icon="pi pi-send"
                @click="submitButtonClickHandler"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
