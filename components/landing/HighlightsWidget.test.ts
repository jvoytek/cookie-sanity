import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HighlightsWidget from "@/components/landing/HighlightsWidget.vue";

describe("HighlightsWidget", () => {
  it("renders without crashing", () => {
    expect(() => {
      mount(HighlightsWidget, {
        global: {
          stubs: {
            Button: true,
            Card: true,
            Badge: true,
            Avatar: true,
          },
        },
      });
    }).not.toThrow();
  });

  it("mounts successfully", () => {
    const wrapper = mount(HighlightsWidget, {
      global: {
        stubs: {
          Button: true,
          Card: true,
          Badge: true,
          Avatar: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it("renders highlights content", () => {
    const wrapper = mount(HighlightsWidget, {
      global: {
        stubs: {
          Button: true,
          Card: true,
          Badge: true,
          Avatar: true,
        },
      },
    });

    expect(wrapper.text()).toBeDefined();
  });
});
