import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TopbarWidget from "@/components/landing/TopbarWidget.vue";

describe("TopbarWidget", () => {
  it("renders without crashing", () => {
    expect(() => {
      mount(TopbarWidget, {
        global: {
          stubs: {
            NuxtLink: true,
            Button: true,
            Menubar: true,
            Avatar: true,
            Menu: true,
            Sidebar: true,
          },
        },
      });
    }).not.toThrow();
  });

  it("mounts successfully", () => {
    const wrapper = mount(TopbarWidget, {
      global: {
        stubs: {
          NuxtLink: true,
          Button: true,
          Menubar: true,
          Avatar: true,
          Menu: true,
          Sidebar: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it("renders topbar content", () => {
    const wrapper = mount(TopbarWidget, {
      global: {
        stubs: {
          NuxtLink: true,
          Button: true,
          Menubar: true,
          Avatar: true,
          Menu: true,
          Sidebar: true,
        },
      },
    });

    expect(wrapper.text()).toBeDefined();
  });
});
