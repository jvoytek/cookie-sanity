import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import NotificationsWidget from "@/components/dashboard/NotificationsWidget.vue";

describe("NotificationsWidget", () => {
  it("renders without crashing", () => {
    expect(() => {
      mount(NotificationsWidget, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            Card: true,
            Button: true,
            Avatar: true,
            Badge: true,
          },
        },
      });
    }).not.toThrow();
  });

  it("mounts successfully", () => {
    const wrapper = mount(NotificationsWidget, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Card: true,
          Button: true,
          Avatar: true,
          Badge: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
