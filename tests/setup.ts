import { vi } from 'vitest';
import { defineStore } from 'pinia';
import { ref, computed, reactive, watch, onMounted } from 'vue';

// Mock Nuxt global functions and auto-imports
//global.defineStore = defineStore
vi.stubGlobal('defineStore', defineStore);
vi.stubGlobal('ref', ref);
vi.stubGlobal('computed', computed);
vi.stubGlobal('reactive', reactive);
vi.stubGlobal('watch', watch);
vi.stubGlobal('onMounted', onMounted);
vi.stubGlobal('navigateTo', vi.fn());

// Mock Supabase composables

const useSupabaseClientMock = vi.fn(() => ({
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

vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

const useSupabaseUserMock = vi.fn(() => ({ value: { id: 'test-user-id' } }));
vi.stubGlobal('useSupabaseUser', useSupabaseUserMock);

// Mock other Nuxt composables
const useToastMock = vi.fn(() => ({
  add: vi.fn(),
}));
vi.stubGlobal('useToast', useToastMock);

// Mock helper composables
const useFormatHelpersMock = vi.fn(() => ({
  formatCurrency: vi.fn((value) => `$${value}`),
  formatDate: vi.fn((date) => date),
  formatPercent: vi.fn((value) => `${value}%`),
}));
vi.stubGlobal('useFormatHelpers', useFormatHelpersMock);

const useLayoutMock = vi.fn(() => ({
  getPrimary: { value: 'emerald' },
  getSurface: { value: null },
  isDarkTheme: { value: false },
  layoutConfig: { darkTheme: false },
  layoutState: { staticMenuDesktopInactive: false },
}));
vi.stubGlobal('useLayout', useLayoutMock);

const usePaymentHelpersMock = vi.fn(() => ({
  form: { value: null },
  submitted: { value: false },
  editPayment: vi.fn(),
  hideDialog: vi.fn(),
  savePayment: vi.fn(),
  deletePayment: vi.fn(),
}));
vi.stubGlobal('usePaymentHelpers', usePaymentHelpersMock);

const useTransactionHelpersMock = vi.fn(() => ({
  form: { value: null },
  submitted: { value: false },
  editTransaction: vi.fn(),
  hideDialog: vi.fn(),
  saveTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  transactionTypeBadgeSeverity: vi.fn(() => 'info'),
}));
vi.stubGlobal('useTransactionHelpers', useTransactionHelpersMock);

const useNotificationHelpersMock = vi.fn(() => ({
  addError: vi.fn(),
  addSuccess: vi.fn(),
}));
vi.stubGlobal('useNotificationHelpers', useNotificationHelpersMock);

// Mock store composables - these will be overridden in individual tests as needed
const useProfileStoreMock = vi.fn(() => ({
  currentProfile: { id: 'test-profile-id' },
}));

vi.stubGlobal('useProfileStore', useProfileStoreMock);

const useSeasonsStoreMock = vi.fn(() => ({
  currentSeason: { id: 1 },
  settingsSelectedSeason: { id: 1 },
  getSeasonName: vi.fn((season) =>
    season ? `${season.year} Season` : '2024 Season',
  ),
  allSeasons: [{ id: 1 }],
}));
vi.stubGlobal('useSeasonsStore', useSeasonsStoreMock);

const useTransactionsStoreMock = vi.fn(() => ({
  sumTransactionsByCookie: vi.fn(() => 0),
  activeTransaction: {},
  transactionDialogFormSchema: { value: [] },
  editTransactionDialogVisible: false,
  deleteTransactionDialogVisible: false,
  transactionTypeOptions: [],
  upsertTransaction: vi.fn(),
  insertNewTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  allTransactions: [
    {
      to: 1,
      status: 'complete',
      cookies: { ABC: -4 },
    },
    {
      to: 1,
      status: 'complete',
      cookies: { ABC: 1 },
    },
    {
      to: 2,
      status: 'complete',
      cookies: { DEF: -5 },
    },
  ],
}));
vi.stubGlobal('useTransactionsStore', useTransactionsStoreMock);

const useAccountsStoreMock = vi.fn(() => ({
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
    girl: { first_name: 'Test Girl', last_name: 'Test' },
    girlPaymentsList: [],
  })),
  troopAccountSummary: {
    troopBalance: 0,
    totalPaid: 0,
    totalOwed: 0,
  },
}));
vi.stubGlobal('useAccountsStore', useAccountsStoreMock);

const useGirlsStoreMock = vi.fn(() => ({
  girlOptions: [],
  allGirls: [
    { id: 1, name: 'Test Girl' },
    { id: 2, name: 'Test Girl 2' },
  ],
}));

vi.stubGlobal('useGirlsStore', useGirlsStoreMock);

const useCookiesStoreMock = vi.fn(() => ({
  allCookies: [
    { abbreviation: 'ABC', price: 5, percent_of_sale: 20 },
    { abbreviation: 'DEF', price: 5, percent_of_sale: 80 },
  ],
  averageCookiePrice: 5,
  allCookiesWithInventoryTotals: [{ onHand: 10 }],
  getCookieByAbbreviation: vi.fn((abbreviation) => {
    if (abbreviation === 'ABC') {
      return {
        abbreviation: 'ABC',
        price: 5,
        percent_of_sale: 20,
        is_virtual: false,
      };
    } else if (abbreviation === 'DEF') {
      return {
        abbreviation: 'DEF',
        price: 5,
        percent_of_sale: 80,
        is_virtual: true,
      };
    }
    return null;
  }),
}));
vi.stubGlobal('useCookiesStore', useCookiesStoreMock);

const useBoothsStoreMock = vi.fn(() => ({
  getPredictedBoothSaleQuantityByCookie: vi.fn(() => -9),
}));
vi.stubGlobal('useBoothsStore', useBoothsStoreMock);

const useUploadsStoreMock = vi.fn(() => ({
  allUploads: [],
  insertUpload: vi.fn(),
  deleteUpload: vi.fn(),
}));
vi.stubGlobal('useUploadsStore', useUploadsStoreMock);
