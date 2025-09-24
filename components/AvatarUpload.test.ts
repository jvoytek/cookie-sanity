import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import AvatarUpload from "@/components/AvatarUpload.vue";

describe("AvatarUpload", () => {
  it("renders without crashing", () => {
    expect(() => {
      mount(AvatarUpload, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            FileUpload: true,
            Avatar: true,
            Button: true,
            Image: true,
            ProgressSpinner: true,
          },
        },
      });
    }).not.toThrow();
  });

  it("mounts successfully", () => {
    const wrapper = mount(AvatarUpload, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          FileUpload: true,
          Avatar: true,
          Button: true,
          Image: true,
          ProgressSpinner: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
