import { computed, reactive } from "vue";

// Initialize dark mode from localStorage if available
const getInitialDarkMode = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('darkMode');
    return stored === 'true';
  }
  return false;
};

const layoutConfig = reactive({
  preset: "Aura",
  primary: "emerald",
  surface: null,
  darkTheme: getInitialDarkMode(),
  menuMode: "static",
});

const layoutState = reactive({
  staticMenuDesktopInactive: false,
  overlayMenuActive: false,
  profileSidebarVisible: false,
  configSidebarVisible: false,
  staticMenuMobileActive: false,
  menuHoverActive: false,
  activeMenuItem: null,
});

export function useLayout() {
  // Initialize dark mode state on the document element
  const initializeDarkMode = () => {
    if (typeof window !== 'undefined' && layoutConfig.darkTheme) {
      document.documentElement.classList.add("app-dark");
    }
  };

  const setActiveMenuItem = (item) => {
    layoutState.activeMenuItem = item.value || item;
  };

  const toggleDarkMode = () => {
    if (!document.startViewTransition) {
      executeDarkModeToggle();

      return;
    }

    document.startViewTransition(() => executeDarkModeToggle());
  };

  const executeDarkModeToggle = () => {
    layoutConfig.darkTheme = !layoutConfig.darkTheme;
    document.documentElement.classList.toggle("app-dark");
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', layoutConfig.darkTheme.toString());
    }
  };

  const toggleMenu = () => {
    if (layoutConfig.menuMode === "overlay") {
      layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
    }

    if (window.innerWidth > 991) {
      layoutState.staticMenuDesktopInactive =
        !layoutState.staticMenuDesktopInactive;
    } else {
      layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive;
    }
  };

  const isSidebarActive = computed(
    () => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive,
  );

  const isDarkTheme = computed(() => layoutConfig.darkTheme);

  const getPrimary = computed(() => layoutConfig.primary);

  const getSurface = computed(() => layoutConfig.surface);

  return {
    layoutConfig,
    layoutState,
    toggleMenu,
    isSidebarActive,
    isDarkTheme,
    getPrimary,
    getSurface,
    setActiveMenuItem,
    toggleDarkMode,
    initializeDarkMode,
  };
}
