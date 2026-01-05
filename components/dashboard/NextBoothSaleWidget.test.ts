import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import NextBoothSaleWidget from '@/components/dashboard/NextBoothSaleWidget.vue';
import type { BoothSale } from '@/types/types';

describe('NextBoothSaleWidget', () => {
  let mockRouterPush: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRouterPush = vi.fn();
    vi.stubGlobal('useRouter', () => ({
      push: mockRouterPush,
    }));
  });

  it('renders without crashing', () => {
    expect(() => {
      mount(NextBoothSaleWidget, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            NuxtTime: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = mount(NextBoothSaleWidget, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          NuxtTime: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('displays "No booth sales scheduled" when there are no upcoming booth sales', () => {
    const wrapper = mount(NextBoothSaleWidget, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              booths: {
                allBoothSales: [],
              },
            },
          }),
        ],
        stubs: {
          NuxtTime: true,
        },
      },
    });

    expect(wrapper.text()).toContain('No booth sales scheduled');
  });

  it('displays booth sale information when there is an upcoming booth sale', () => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 7); // 7 days from now
    const formattedDate = `${String(futureDate.getMonth() + 1).padStart(2, '0')}/${String(futureDate.getDate()).padStart(2, '0')}/${futureDate.getFullYear()}`;

    const mockBoothSale: BoothSale = {
      id: 1,
      sale_date: formattedDate,
      sale_time: '10:00 AM',
      location: 'Walmart',
      scouts_attending: [],
      inventory_type: 'troop',
      expected_sales: 100,
      predicted_cookies: {},
      cookies_sold: {},
      notes: '',
      profile: 'test-profile',
      season: 1,
      created_at: '',
    };

    vi.stubGlobal('useBoothsStore', () => ({
      allBoothSales: [mockBoothSale],
      upcomingBoothSales: [mockBoothSale],
    }));

    const wrapper = mount(NextBoothSaleWidget, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          NuxtTime: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Walmart');
  });

  it('navigates to booth-sales page on click', async () => {
    const wrapper = mount(NextBoothSaleWidget, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          NuxtTime: true,
        },
      },
    });

    await wrapper.find('.card').trigger('click');
    expect(mockRouterPush).toHaveBeenCalledWith('/booth-sales');
  });
});
