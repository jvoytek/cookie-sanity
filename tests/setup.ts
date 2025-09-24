import { vi } from "vitest";
import { defineStore } from "pinia";
import { ref, computed, reactive, watch, onMounted } from "vue";

// Mock Nuxt global functions and auto-imports
global.defineStore = defineStore;
global.ref = ref;
global.computed = computed;
global.reactive = reactive;
global.watch = watch;
global.onMounted = onMounted;
global.navigateTo = vi.fn();

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

// Mock helper composables
global.useFormatHelpers = vi.fn(() => ({
  formatCurrency: vi.fn((value) => `$${value}`),
  formatDate: vi.fn((date) => date),
  formatPercent: vi.fn((value) => `${value}%`),
}));

global.useLayout = vi.fn(() => ({
  getPrimary: { value: "emerald" },
  getSurface: { value: null },
  isDarkTheme: { value: false },
  layoutConfig: { darkTheme: false },
  layoutState: { staticMenuDesktopInactive: false },
}));

global.usePaymentHelpers = vi.fn(() => ({
  form: { value: null },
  submitted: { value: false },
  editPayment: vi.fn(),
  hideDialog: vi.fn(),
  savePayment: vi.fn(),
  deletePayment: vi.fn(),
}));

global.useTransactionHelpers = vi.fn(() => ({
  form: { value: null },
  submitted: { value: false },
  editTransaction: vi.fn(),
  hideDialog: vi.fn(),
  saveTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  transactionTypeBadgeSeverity: vi.fn(() => "info"),
}));

// Mock store composables - these will be overridden in individual tests as needed
global.useProfileStore = vi.fn(() => ({
  currentProfile: { id: "test-profile-id" },
}));

global.useSeasonsStore = vi.fn(() => ({
  currentSeason: { id: 1 },
  settingsSelectedSeason: { id: 1 },
  getSeasonName: vi.fn((season) =>
    season ? `${season.year} Season` : "2024 Season",
  ),
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
  troopBalance: { value: 0 },
  allBalances: [],
  getGirlAccountById: vi.fn(() => ({
    balance: 0,
    payments: [],
    girl: { first_name: "Test Girl", last_name: "Test" },
    girlPaymentsList: [],
  })),
  troopAccountSummary: {
    troopBalance: 0,
    totalPaid: 0,
    totalOwed: 0,
  },
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

global.useUploadsStore = vi.fn(() => ({
  allUploads: [],
  insertUpload: vi.fn(),
  deleteUpload: vi.fn(),
}));
