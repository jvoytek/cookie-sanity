import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import CookieReceiptTable from '@/components/other/CookieReceiptTable.vue';
import { useCookiesStore } from '@/stores/cookies';

describe('CookieReceiptTable', () => {
  const mockCookies = {
    ABC: 12,
    DEF: 6,
    GHI: 24,
  };

  const mockCookiesList = [
    { id: 1, abbreviation: 'ABC', name: 'Amazing Cookies', price: 5.0, is_virtual: false, order: 1 },
    { id: 2, abbreviation: 'DEF', name: 'Delicious Cookies', price: 6.0, is_virtual: false, order: 2 },
    { id: 3, abbreviation: 'GHI', name: 'Great Cookies', price: 5.0, is_virtual: false, order: 3 },
  ];

  it('renders without crashing', () => {
    expect(() => {
      const pinia = createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      });

      const cookiesStore = useCookiesStore(pinia);
      cookiesStore.allCookies = mockCookiesList;
      cookiesStore.allCookiesNotVirtual = mockCookiesList;

      mount(CookieReceiptTable, {
        props: {
          cookies: mockCookies,
        },
        global: {
          plugins: [pinia],
          stubs: {
            DataTable: true,
            Column: true,
            ColumnGroup: true,
            Row: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    });

    const cookiesStore = useCookiesStore(pinia);
    cookiesStore.allCookies = mockCookiesList;
    cookiesStore.allCookiesNotVirtual = mockCookiesList;

    const wrapper = mount(CookieReceiptTable, {
      props: {
        cookies: mockCookies,
      },
      global: {
        plugins: [pinia],
        stubs: {
          DataTable: true,
          Column: true,
          ColumnGroup: true,
          Row: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('handles empty cookies object', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    });

    const cookiesStore = useCookiesStore(pinia);
    cookiesStore.allCookies = mockCookiesList;
    cookiesStore.allCookiesNotVirtual = mockCookiesList;

    const wrapper = mount(CookieReceiptTable, {
      props: {
        cookies: {},
      },
      global: {
        plugins: [pinia],
        stubs: {
          DataTable: true,
          Column: true,
          ColumnGroup: true,
          Row: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
