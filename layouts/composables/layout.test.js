import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLayout } from "@/layouts/composables/layout.js";

// Mock DOM API
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 1024,
});

const mockDocumentElement = {
  classList: {
    toggle: vi.fn(),
  },
};

Object.defineProperty(document, "documentElement", {
  value: mockDocumentElement,
  writable: true,
});

Object.defineProperty(document, "startViewTransition", {
  value: vi.fn((callback) => callback()),
  writable: true,
});

describe("layouts/composables/layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window size
    window.innerWidth = 1024;
    // Reset document.startViewTransition
    document.startViewTransition = vi.fn((callback) => callback());

    // Reset layout state - since these are reactive objects shared between tests
    const { layoutConfig, layoutState } = useLayout();
    layoutConfig.darkTheme = false;
    layoutConfig.primary = "emerald";
    layoutConfig.surface = null;
    layoutConfig.menuMode = "static";
    layoutState.staticMenuDesktopInactive = false;
    layoutState.overlayMenuActive = false;
    layoutState.profileSidebarVisible = false;
    layoutState.configSidebarVisible = false;
    layoutState.staticMenuMobileActive = false;
    layoutState.menuHoverActive = false;
    layoutState.activeMenuItem = null;
  });

  describe("composable functionality", () => {
    it("returns all expected properties and methods", () => {
      const result = useLayout();

      expect(result).toHaveProperty("layoutConfig");
      expect(result).toHaveProperty("layoutState");
      expect(result).toHaveProperty("toggleMenu");
      expect(result).toHaveProperty("isSidebarActive");
      expect(result).toHaveProperty("isDarkTheme");
      expect(result).toHaveProperty("getPrimary");
      expect(result).toHaveProperty("getSurface");
      expect(result).toHaveProperty("setActiveMenuItem");
      expect(result).toHaveProperty("toggleDarkMode");

      expect(typeof result.toggleMenu).toBe("function");
      expect(typeof result.setActiveMenuItem).toBe("function");
      expect(typeof result.toggleDarkMode).toBe("function");
    });

    it("toggles dark mode correctly", () => {
      const { toggleDarkMode, layoutConfig } = useLayout();

      expect(layoutConfig.darkTheme).toBe(false);

      toggleDarkMode();

      expect(document.startViewTransition).toHaveBeenCalled();
      expect(layoutConfig.darkTheme).toBe(true);
      expect(mockDocumentElement.classList.toggle).toHaveBeenCalledWith(
        "app-dark",
      );
    });

    it("sets active menu item correctly", () => {
      const { setActiveMenuItem, layoutState } = useLayout();
      const menuItem = { value: "dashboard", label: "Dashboard" };

      setActiveMenuItem(menuItem);

      expect(layoutState.activeMenuItem).toBe("dashboard");
    });

    it("toggles menu states correctly", () => {
      const { toggleMenu, layoutConfig, layoutState } = useLayout();

      layoutConfig.menuMode = "overlay";
      expect(layoutState.overlayMenuActive).toBe(false);

      toggleMenu();

      expect(layoutState.overlayMenuActive).toBe(true);
    });

    it("computes sidebar active state correctly", () => {
      const { layoutState, isSidebarActive } = useLayout();

      layoutState.overlayMenuActive = true;
      expect(isSidebarActive.value).toBe(true);

      layoutState.overlayMenuActive = false;
      layoutState.staticMenuMobileActive = true;
      expect(isSidebarActive.value).toBe(true);

      layoutState.staticMenuMobileActive = false;
      expect(isSidebarActive.value).toBe(false);
    });

    it("provides reactive computed properties", () => {
      const { layoutConfig, isDarkTheme, getPrimary, getSurface } = useLayout();

      expect(isDarkTheme.value).toBe(false);
      expect(getPrimary.value).toBe("emerald");
      expect(getSurface.value).toBe(null);

      layoutConfig.darkTheme = true;
      layoutConfig.primary = "blue";
      layoutConfig.surface = "light";

      expect(isDarkTheme.value).toBe(true);
      expect(getPrimary.value).toBe("blue");
      expect(getSurface.value).toBe("light");
    });
  });
});
