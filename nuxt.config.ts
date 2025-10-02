// https://nuxt.com/docs/api/configuration/nuxt-config

import Aura from '@primevue/themes/aura';
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  css: ['~/assets/tailwind.css', '~/assets/styles.scss', '~/assets/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  modules: [
    '@nuxtjs/supabase',
    '@primevue/nuxt-module',
    '@pinia/nuxt',
    '@formkit/nuxt',
    '@nuxt/test-utils/module',
  ],

  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
  },
  formkitPrimevue: {
    includePrimeIcons: true,
    includeStyles: true,
    installFormKit: true,
  },
  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: '.app-dark',
          cssLayer: false,
        },
      },
    },
  },
  components: [
    {
      path: '~/components', // will get any components nested in let's say /components/test too
      pathPrefix: false,
    },
  ],
});
