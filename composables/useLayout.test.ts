import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLayout } from "@/composables/useLayout";

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

describe("useLayout", () => {
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

  describe("initial state", () => {
    it("returns correct initial layout config and state", () => {
      const {
        layoutConfig,
        layoutState,
        isDarkTheme,
        getPrimary,
        getSurface,
        isSidebarActive,
      } = useLayout();

      expect(layoutConfig.preset).toBe("Aura");
      expect(layoutConfig.primary).toBe("emerald");
      expect(layoutConfig.surface).toBe(null);
      expect(layoutConfig.darkTheme).toBe(false);
      expect(layoutConfig.menuMode).toBe("static");

      expect(layoutState.staticMenuDesktopInactive).toBe(false);
      expect(layoutState.overlayMenuActive).toBe(false);
      expect(layoutState.profileSidebarVisible).toBe(false);
      expect(layoutState.configSidebarVisible).toBe(false);
      expect(layoutState.staticMenuMobileActive).toBe(false);
      expect(layoutState.menuHoverActive).toBe(false);
      expect(layoutState.activeMenuItem).toBe(null);

      expect(isDarkTheme.value).toBe(false);
      expect(getPrimary.value).toBe("emerald");
      expect(getSurface.value).toBe(null);
      expect(isSidebarActive.value).toBe(false);
    });
  });

  describe("setActiveMenuItem", () => {
    it("sets active menu item with value property", () => {
      const { setActiveMenuItem, layoutState } = useLayout();
      const menuItem = { value: "dashboard", label: "Dashboard" };

      setActiveMenuItem(menuItem);

      expect(layoutState.activeMenuItem).toBe("dashboard");
    });

    it("sets active menu item without value property", () => {
      const { setActiveMenuItem, layoutState } = useLayout();
      const menuItem = "settings";

      setActiveMenuItem(menuItem);

      expect(layoutState.activeMenuItem).toBe("settings");
    });
  });

  describe("toggleDarkMode", () => {
    it("toggles dark mode when startViewTransition is available", () => {
      const { toggleDarkMode, layoutConfig } = useLayout();

      expect(layoutConfig.darkTheme).toBe(false);

      toggleDarkMode();

      expect(document.startViewTransition).toHaveBeenCalled();
      expect(layoutConfig.darkTheme).toBe(true);
      expect(mockDocumentElement.classList.toggle).toHaveBeenCalledWith(
        "app-dark",
      );
    });

    it("toggles dark mode when startViewTransition is not available", () => {
      const { toggleDarkMode, layoutConfig } = useLayout();

      // Mock startViewTransition as undefined to simulate older browser
      const originalStartViewTransition = document.startViewTransition;
      document.startViewTransition = undefined;

      expect(layoutConfig.darkTheme).toBe(false);

      toggleDarkMode();

      expect(layoutConfig.darkTheme).toBe(true);
      expect(mockDocumentElement.classList.toggle).toHaveBeenCalledWith(
        "app-dark",
      );

      // Restore original function
      document.startViewTransition = originalStartViewTransition;
    });

    it("toggles dark mode multiple times correctly", () => {
      const { toggleDarkMode, _layoutConfig, isDarkTheme } = useLayout();

      expect(isDarkTheme.value).toBe(false);

      toggleDarkMode();
      expect(isDarkTheme.value).toBe(true);

      toggleDarkMode();
      expect(isDarkTheme.value).toBe(false);

      expect(mockDocumentElement.classList.toggle).toHaveBeenCalledTimes(2);
    });
  });

  describe("toggleMenu", () => {
    it("toggles overlay menu when in overlay mode", () => {
      const { toggleMenu, layoutConfig, layoutState } = useLayout();

      layoutConfig.menuMode = "overlay";
      expect(layoutState.overlayMenuActive).toBe(false);

      toggleMenu();

      expect(layoutState.overlayMenuActive).toBe(true);

      toggleMenu();

      expect(layoutState.overlayMenuActive).toBe(false);
    });

    it("toggles desktop menu when window width > 991", () => {
      const { toggleMenu, layoutState } = useLayout();

      window.innerWidth = 1200;
      expect(layoutState.staticMenuDesktopInactive).toBe(false);

      toggleMenu();

      expect(layoutState.staticMenuDesktopInactive).toBe(true);
      expect(layoutState.staticMenuMobileActive).toBe(false);
    });

    it("toggles mobile menu when window width <= 991", () => {
      const { toggleMenu, layoutState } = useLayout();

      window.innerWidth = 768;
      expect(layoutState.staticMenuMobileActive).toBe(false);

      toggleMenu();

      expect(layoutState.staticMenuMobileActive).toBe(true);
      expect(layoutState.staticMenuDesktopInactive).toBe(false);
    });

    it("handles overlay mode and desktop width combination", () => {
      const { toggleMenu, layoutConfig, layoutState } = useLayout();

      layoutConfig.menuMode = "overlay";
      window.innerWidth = 1200;

      toggleMenu();

      expect(layoutState.overlayMenuActive).toBe(true);
      expect(layoutState.staticMenuDesktopInactive).toBe(true);
    });

    it("handles overlay mode and mobile width combination", () => {
      const { toggleMenu, layoutConfig, layoutState } = useLayout();

      layoutConfig.menuMode = "overlay";
      window.innerWidth = 768;

      toggleMenu();

      expect(layoutState.overlayMenuActive).toBe(true);
      expect(layoutState.staticMenuMobileActive).toBe(true);
    });
  });

  describe("isSidebarActive computed", () => {
    it("returns true when overlay menu is active", () => {
      const { layoutState, isSidebarActive } = useLayout();

      layoutState.overlayMenuActive = true;
      layoutState.staticMenuMobileActive = false;

      expect(isSidebarActive.value).toBe(true);
    });

    it("returns true when static mobile menu is active", () => {
      const { layoutState, isSidebarActive } = useLayout();

      layoutState.overlayMenuActive = false;
      layoutState.staticMenuMobileActive = true;

      expect(isSidebarActive.value).toBe(true);
    });

    it("returns true when both menus are active", () => {
      const { layoutState, isSidebarActive } = useLayout();

      layoutState.overlayMenuActive = true;
      layoutState.staticMenuMobileActive = true;

      expect(isSidebarActive.value).toBe(true);
    });

    it("returns false when no menus are active", () => {
      const { layoutState, isSidebarActive } = useLayout();

      layoutState.overlayMenuActive = false;
      layoutState.staticMenuMobileActive = false;

      expect(isSidebarActive.value).toBe(false);
    });
  });

  describe("computed properties", () => {
    it("isDarkTheme reflects layoutConfig.darkTheme", () => {
      const { layoutConfig, isDarkTheme } = useLayout();

      expect(isDarkTheme.value).toBe(false);

      layoutConfig.darkTheme = true;
      expect(isDarkTheme.value).toBe(true);
    });

    it("getPrimary reflects layoutConfig.primary", () => {
      const { layoutConfig, getPrimary } = useLayout();

      expect(getPrimary.value).toBe("emerald");

      layoutConfig.primary = "blue";
      expect(getPrimary.value).toBe("blue");
    });

    it("getSurface reflects layoutConfig.surface", () => {
      const { layoutConfig, getSurface } = useLayout();

      expect(getSurface.value).toBe(null);

      layoutConfig.surface = "light";
      expect(getSurface.value).toBe("light");
    });
  });

  describe("return values", () => {
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
  });
});
