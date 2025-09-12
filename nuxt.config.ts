// https://nuxt.com/docs/api/configuration/nuxt-config

import Aura from "@primevue/themes/aura";
import tailwindcss from "@tailwindcss/vite";
import { config as dotenvConfig } from "dotenv";

// Load environment variables from .env.local if present (for local Supabase dev)
dotenvConfig({ path: ".env.local" });

export default defineNuxtConfig({
  // For local Supabase development, set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local
  compatibilityDate: "2024-11-01",
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  css: ["~/assets/tailwind.css", "~/assets/styles.scss", "~/assets/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  modules: [
    "@nuxtjs/supabase",
    "@primevue/nuxt-module",
    "@pinia/nuxt",
    "@formkit/nuxt",
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
          prefix: "p",
          darkModeSelector: "system",
          cssLayer: false,
        },
      },
    },
  },
});
