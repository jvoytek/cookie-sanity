import { vi } from "vitest";
import { defineStore } from "pinia";
import { ref, computed, reactive } from "vue";

// Mock Nuxt global functions and auto-imports
global.defineStore = defineStore;
global.ref = ref;
global.computed = computed;
global.reactive = reactive;

// Mock Supabase composables
global.useSupabaseClient = vi.fn(() => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

global.useSupabaseUser = vi.fn(() => ({ value: { id: "test-user-id" } }));

// Mock other Nuxt composables
global.useToast = vi.fn(() => ({
  add: vi.fn(),
}));

// Mock store composables - these will be overridden in individual tests as needed
global.useProfileStore = vi.fn(() => ({
  currentProfile: { id: "test-profile-id" },
}));

global.useSeasonsStore = vi.fn(() => ({
  currentSeason: { id: 1 },
  settingsSelectedSeason: { id: 1 },
}));

global.useOrdersStore = vi.fn(() => ({
  sumOrdersByCookie: vi.fn(() => 0),
  totalTransactionsByStatusAndCookie: vi.fn(() => 0),
  activeTransaction: {},
  transactionDialogFormSchema: { value: [] },
  editTransactionDialogVisible: false,
  deleteTransactionDialogVisible: false,
  transactionTypeOptions: [],
  upsertOrder: vi.fn(),
  insertNewOrderFromOrdersList: vi.fn(),
  deleteOrder: vi.fn(),
}));

global.useAccountsStore = vi.fn(() => ({
  activePayment: {},
  paymentDialogFormSchema: { value: [] },
  editPaymentDialogVisible: false,
  deletePaymentDialogVisible: false,
  upsertPayment: vi.fn(),
  insertNewPayment: vi.fn(),
  deletePayment: vi.fn(),
}));

global.useGirlsStore = vi.fn(() => ({
  girlOptions: [],
}));

global.useCookiesStore = vi.fn(() => ({
  allCookies: [],
}));

global.useBoothsStore = vi.fn(() => ({
  getPredictedAmountForCookie: vi.fn(() => -9),
}));
