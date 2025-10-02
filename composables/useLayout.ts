import { computed, reactive } from 'vue';

type LayoutConfig = {
  preset: string;
  primary: string;
  surface: string | null;
  darkTheme: boolean;
  menuMode: 'static' | 'overlay';
};

type LayoutState = {
  staticMenuDesktopInactive: boolean;
  overlayMenuActive: boolean;
  profileSidebarVisible: boolean;
  configSidebarVisible: boolean;
  staticMenuMobileActive: boolean;
  menuHoverActive: boolean;
  activeMenuItem: string | null;
};

const getInitialDarkMode = (): boolean => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('darkMode');
    return stored === 'true';
  }
  return false;
};

const layoutConfig = reactive<LayoutConfig>({
  preset: 'Aura',
  primary: 'emerald',
  surface: null,
  darkTheme: getInitialDarkMode(),
  menuMode: 'static',
});

const layoutState = reactive<LayoutState>({
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
  const initializeDarkMode = (): void => {
    if (typeof window !== 'undefined' && layoutConfig.darkTheme) {
      document.documentElement.classList.add('app-dark');
    }
  };

  const setActiveMenuItem = (item: string | { value: string }): void => {
    layoutState.activeMenuItem = typeof item === 'string' ? item : item.value;
  };

  const toggleDarkMode = (): void => {
    if (!document.startViewTransition) {
      executeDarkModeToggle();
      return;
    }

    document.startViewTransition(() => executeDarkModeToggle());
  };

  const executeDarkModeToggle = (): void => {
    layoutConfig.darkTheme = !layoutConfig.darkTheme;
    document.documentElement.classList.toggle('app-dark');

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', layoutConfig.darkTheme.toString());
    }
  };

  const toggleMenu = (): void => {
    if (layoutConfig.menuMode === 'overlay') {
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
    (): boolean =>
      layoutState.overlayMenuActive || layoutState.staticMenuMobileActive,
  );

  const isDarkTheme = computed((): boolean => layoutConfig.darkTheme);

  const getPrimary = computed((): string => layoutConfig.primary);

  const getSurface = computed((): string | null => layoutConfig.surface);

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
