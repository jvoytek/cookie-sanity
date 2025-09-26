import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import CookieList from "@/components/other/CookieList.vue";

describe("CookieList Component", () => {
  it("renders the total cookies correctly", () => {
    const wrapper = mount(CookieList, {
      props: {
        cookies: { ADV: 5, TM: 2 },
      },
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              cookies: {
                allCookies: [
                  {
                    abbreviation: "ADV",
                    name: "Adventurefuls",
                    color: "#FF5733",
                  },
                  { abbreviation: "TM", name: "Thin Mints", color: "#33FF57" },
                ],
              },
            },
          }),
        ],
      },
    });
    console.log(wrapper.html());
    expect(wrapper.find("div > span:last-child").text()).toContain("Total: 7");
    expect(wrapper.text()).toContain("5 Adventurefuls");
    expect(wrapper.text()).toContain("2 Thin Mints");
    expect(wrapper.html()).toContain("#FF5733");
    expect(wrapper.html()).toContain("#33FF57");
  });
});
