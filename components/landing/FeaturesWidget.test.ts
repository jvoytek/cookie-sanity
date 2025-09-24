import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import FeaturesWidget from "@/components/landing/FeaturesWidget.vue";

describe("FeaturesWidget", () => {
  it("renders without crashing", () => {
    expect(() => {
      mount(FeaturesWidget, {
        global: {
          stubs: {
            Button: true,
            Card: true,
            Badge: true,
          },
        },
      });
    }).not.toThrow();
  });

  it("mounts successfully", () => {
    const wrapper = mount(FeaturesWidget, {
      global: {
        stubs: {
          Button: true,
          Card: true,
          Badge: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
