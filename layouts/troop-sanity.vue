<script setup>
  import { useLayout } from '@/composables/useLayout';
  import { $t, updatePreset } from '@primevue/themes';
  import Aura from '@primevue/themes/aura';
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import TroopSanityTopbar from './TroopSanityTopbar.vue';
  import TroopSanitySidebar from './TroopSanitySidebar.vue';
  import AppFooter from './AppFooter.vue';

  const { layoutConfig, layoutState, isSidebarActive, initializeDarkMode } =
    useLayout();

  const outsideClickListener = ref(null);
  const user = useSupabaseUser();

  // Violet color palette for Troop Sanity
  const troopPrimaryPalette = {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  };

  // Emerald palette to restore when leaving
  const defaultPrimaryPalette = {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  };

  function applyTroopTheme() {
    updatePreset({
      semantic: {
        primary: troopPrimaryPalette,
        colorScheme: {
          light: {
            primary: {
              color: '{primary.500}',
              contrastColor: '#ffffff',
              hoverColor: '{primary.600}',
              activeColor: '{primary.700}',
            },
            highlight: {
              background: '{primary.50}',
              focusBackground: '{primary.100}',
              color: '{primary.700}',
              focusColor: '{primary.800}',
            },
          },
          dark: {
            primary: {
              color: '{primary.400}',
              contrastColor: '{surface.900}',
              hoverColor: '{primary.300}',
              activeColor: '{primary.200}',
            },
            highlight: {
              background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
              focusBackground:
                'color-mix(in srgb, {primary.400}, transparent 76%)',
              color: 'rgba(255,255,255,.87)',
              focusColor: 'rgba(255,255,255,.87)',
            },
          },
        },
      },
    });
  }

  function restoreDefaultTheme() {
    $t()
      .preset(Aura)
      .preset({
        semantic: {
          primary: defaultPrimaryPalette,
          colorScheme: {
            light: {
              primary: {
                color: '{primary.500}',
                contrastColor: '#ffffff',
                hoverColor: '{primary.600}',
                activeColor: '{primary.700}',
              },
              highlight: {
                background: '{primary.50}',
                focusBackground: '{primary.100}',
                color: '{primary.700}',
                focusColor: '{primary.800}',
              },
            },
            dark: {
              primary: {
                color: '{primary.400}',
                contrastColor: '{surface.900}',
                hoverColor: '{primary.300}',
                activeColor: '{primary.200}',
              },
              highlight: {
                background:
                  'color-mix(in srgb, {primary.400}, transparent 84%)',
                focusBackground:
                  'color-mix(in srgb, {primary.400}, transparent 76%)',
                color: 'rgba(255,255,255,.87)',
                focusColor: 'rgba(255,255,255,.87)',
              },
            },
          },
        },
      })
      .use({ useDefaultOptions: true });
  }

  onMounted(() => {
    initializeDarkMode();
    applyTroopTheme();
  });

  onBeforeUnmount(() => {
    restoreDefaultTheme();
  });

  watch(isSidebarActive, (newVal) => {
    if (newVal) {
      bindOutsideClickListener();
    } else {
      unbindOutsideClickListener();
    }
  });

  const containerClass = computed(() => {
    return {
      'layout-overlay': layoutConfig.menuMode === 'overlay',
      'layout-static': layoutConfig.menuMode === 'static',
      'layout-static-inactive':
        !user.value ||
        (layoutState.staticMenuDesktopInactive &&
          layoutConfig.menuMode === 'static'),
      'layout-overlay-active': layoutState.overlayMenuActive,
      'layout-mobile-active': layoutState.staticMenuMobileActive,
    };
  });

  function bindOutsideClickListener() {
    if (!outsideClickListener.value) {
      outsideClickListener.value = (event) => {
        if (isOutsideClicked(event)) {
          layoutState.overlayMenuActive = false;
          layoutState.staticMenuMobileActive = false;
          layoutState.menuHoverActive = false;
        }
      };
      document.addEventListener('click', outsideClickListener.value);
    }
  }

  function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
      document.removeEventListener('click', outsideClickListener);
      outsideClickListener.value = null;
    }
  }

  function isOutsideClicked(event) {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-menu-button');

    return !(
      sidebarEl.isSameNode(event.target) ||
      sidebarEl.contains(event.target) ||
      topbarEl.isSameNode(event.target) ||
      topbarEl.contains(event.target)
    );
  }
</script>

<template>
  <div>
    <div class="layout-wrapper" :class="containerClass">
      <troop-sanity-topbar />
      <troop-sanity-sidebar v-if="user" />
      <div class="layout-main-container">
        <div class="layout-main">
          <slot />
        </div>
        <app-footer />
      </div>
      <div class="layout-mask animate-fadein" />
    </div>
    <Toast />
  </div>
</template>
