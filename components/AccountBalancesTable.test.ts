import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import AccountBalancesTable from "@/components/AccountBalancesTable.vue";

describe("AccountBalancesTable", () => {
  it("renders without crashing", () => {
    expect(() => {
      mount(AccountBalancesTable, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            DataTable: true,
            Column: true,
            Button: true,
            Badge: true,
          },
        },
      });
    }).not.toThrow();
  });

  it("mounts successfully", () => {
    const wrapper = mount(AccountBalancesTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          Button: true,
          Badge: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
