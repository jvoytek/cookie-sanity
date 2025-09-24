import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import RecentSalesWidget from "@/components/dashboard/RecentSalesWidget.vue";

describe("RecentSalesWidget", () => {
  it("renders without crashing", () => {
    expect(() => {
      mount(RecentSalesWidget, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            Card: true,
            Button: true,
            DataTable: true,
            Badge: true,
            Rating: true,
          },
        },
      });
    }).not.toThrow();
  });

  it("mounts successfully", () => {
    const wrapper = mount(RecentSalesWidget, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Card: true,
          Button: true,
          DataTable: true,
          Badge: true,
          Rating: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
