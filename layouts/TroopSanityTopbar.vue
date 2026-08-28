<script setup>
  import { useLayout } from '@/composables/useLayout';
  import { useWindowSize } from '@vueuse/core';

  const { width } = useWindowSize();
  const screenWidth = width;

  const supabase = useSupabaseClient();

  const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
  const user = useSupabaseUser();
  const loading = ref(false);
  const profileStore = useProfileStore();
  loading.value = false;

  const menu = ref(null);
  const userMenuItems = ref([
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      url: '/settings',
    },
    {
      label: 'Sign Out',
      icon: 'pi pi-sign-out',
      command: () => signOut(),
      disabled: loading.value,
    },
  ]);

  function toggleOverlayMenu(event) {
    menu.value.toggle(event);
  }

  async function signOut() {
    try {
      loading.value = true;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      alert(error.message);
    } finally {
      loading.value = false;
      window.location.reload();
    }
  }
</script>

<template>
  <div class="layout-topbar">
    <div class="layout-topbar-logo-container">
      <button
        v-if="user"
        class="layout-menu-button layout-topbar-action"
        @click="toggleMenu"
      >
        <i class="pi pi-bars" />
      </button>
      <router-link to="/troop-sanity" class="layout-topbar-logo">
        <span class="hidden md:block font-semibold">Troop Sanity</span>
        <strong class="block md:hidden text-primary">TS</strong>
      </router-link>
    </div>

    <div class="layout-topbar-actions">
      <div class="layout-config-menu">
        <button
          type="button"
          class="layout-topbar-action"
          @click="toggleDarkMode"
        >
          <i
            :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"
          />
        </button>

        <div class="relative">
          <Menu ref="menu" :model="userMenuItems" :popup="true" />
          <Button
            @click="toggleOverlayMenu"
            icon="pi pi-user"
            :label="screenWidth < 640 ? '' : profileStore.display_name"
            rounded
            text
            severity="contrast"
          />
        </div>
      </div>

      <SeasonSelect />
    </div>
  </div>
</template>
