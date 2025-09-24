import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import AccountSummaryWidget from "@/components/dashboard/AccountSummaryWidget.vue";

// Mock useFormatHelpers
const mockFormatHelpers = {
  formatCurrency: vi.fn((value) => `$${value}`),
  formatDate: vi.fn((date) => date),
  formatPercent: vi.fn((value) => `${value}%`),
};
global.useFormatHelpers = vi.fn(() => mockFormatHelpers);

describe("AccountSummaryWidget", () => {
  it("renders without crashing", () => {
    expect(() => {
      mount(AccountSummaryWidget, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            Card: true,
            Chart: true,
            Button: true,
            DataTable: true,
          },
        },
      });
    }).not.toThrow();
  });

  it("mounts successfully", () => {
    const wrapper = mount(AccountSummaryWidget, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Card: true,
          Chart: true,
          Button: true,
          DataTable: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
