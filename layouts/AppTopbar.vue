<script setup>
  import { useLayout } from '@/composables/useLayout';
  import AppConfigurator from './AppConfigurator.vue';
  import SeasonSelect from '~/components/settings/SeasonSelect.vue';
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
      // reload the page to reset state
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
      <router-link to="/" class="layout-topbar-logo">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 144 143.999998"
          width="54"
          height="40"
          fill="none"
          class="hidden md:block"
        >
          <g clip-path="url(#eb7b912c21)">
            <path
              fill="var(--primary-color)"
              d="M 73.675781 120.601562 C 69.964844 121.363281 66.128906 121.765625 62.195312 121.765625 C 30.773438 121.765625 5.261719 96.21875 5.261719 64.75 C 5.261719 34.75 28.453125 10.128906 57.847656 7.898438 C 54.316406 13.710938 53.574219 21.316406 66.914062 24.285156 C 90.882812 29.621094 63.984375 44.453125 60.800781 50.03125 C 57.726562 55.417969 56.644531 56.53125 59.722656 57.953125 C 67.671875 61.628906 62.535156 69.398438 71.40625 77.394531 C 77.578125 82.957031 72.066406 84.714844 74.105469 92.878906 C 75.359375 97.902344 62.03125 112.5625 69.609375 113.941406 C 72.921875 114.546875 73.953125 117.105469 73.675781 120.601562 Z M 73.675781 120.601562 "
              fill-opacity="1"
              fill-rule="evenodd"
            />
          </g>
          <path
            fill="var(--primary-color)"
            d="M 94.511719 14.308594 C 95.925781 14.574219 97.339844 14.898438 98.753906 15.277344 C 129.109375 23.421875 147.144531 54.710938 139.011719 85.101562 C 131.898438 111.695312 107.09375 128.847656 80.671875 127.273438 C 81.84375 123.964844 81.511719 121.226562 78.464844 119.785156 C 71.503906 116.488281 88.164062 105.78125 88.253906 100.605469 C 88.394531 92.191406 94.171875 91.917969 89.648438 84.949219 C 83.148438 74.925781 90.117188 68.75 83.386719 63.140625 C 80.78125 60.96875 82.117188 60.175781 86.476562 55.769531 C 90.992188 51.207031 120.808594 43.851562 99.035156 32.484375 C 86.917969 26.160156 89.601562 19.003906 94.511719 14.308594 Z M 94.511719 14.308594 "
            fill-opacity="1"
            fill-rule="evenodd"
          />
          <path
            fill="var(--primary-color)"
            d="M 74.296875 52.199219 C 74.296875 52.507812 74.234375 52.800781 74.105469 53.085938 C 73.976562 53.367188 73.796875 53.617188 73.5625 53.835938 C 73.328125 54.050781 73.054688 54.21875 72.746094 54.335938 C 72.441406 54.453125 72.121094 54.511719 71.789062 54.511719 C 71.457031 54.511719 71.136719 54.453125 70.828125 54.335938 C 70.519531 54.21875 70.25 54.050781 70.015625 53.835938 C 69.777344 53.617188 69.597656 53.367188 69.46875 53.085938 C 69.34375 52.800781 69.28125 52.507812 69.28125 52.199219 C 69.28125 51.894531 69.34375 51.597656 69.46875 51.316406 C 69.597656 51.03125 69.777344 50.78125 70.015625 50.566406 C 70.25 50.347656 70.519531 50.179688 70.828125 50.0625 C 71.136719 49.945312 71.457031 49.886719 71.789062 49.886719 C 72.121094 49.886719 72.441406 49.945312 72.746094 50.0625 C 73.054688 50.179688 73.328125 50.347656 73.5625 50.566406 C 73.796875 50.78125 73.976562 51.03125 74.105469 51.316406 C 74.234375 51.597656 74.296875 51.894531 74.296875 52.199219 Z M 74.296875 52.199219 "
            fill-opacity="1"
            fill-rule="nonzero"
          />
          <path
            fill="var(--primary-color)"
            d="M 74.296875 11.996094 C 74.296875 12.300781 74.234375 12.597656 74.105469 12.878906 C 73.976562 13.164062 73.796875 13.414062 73.5625 13.628906 C 73.328125 13.847656 73.054688 14.015625 72.746094 14.132812 C 72.441406 14.25 72.121094 14.308594 71.789062 14.308594 C 71.457031 14.308594 71.136719 14.25 70.828125 14.132812 C 70.519531 14.015625 70.25 13.847656 70.015625 13.628906 C 69.777344 13.414062 69.597656 13.164062 69.46875 12.878906 C 69.34375 12.597656 69.28125 12.300781 69.28125 11.996094 C 69.28125 11.6875 69.34375 11.394531 69.46875 11.109375 C 69.597656 10.828125 69.777344 10.578125 70.015625 10.359375 C 70.25 10.144531 70.519531 9.976562 70.828125 9.859375 C 71.136719 9.742188 71.457031 9.683594 71.789062 9.683594 C 72.121094 9.683594 72.441406 9.742188 72.746094 9.859375 C 73.054688 9.976562 73.328125 10.144531 73.5625 10.359375 C 73.796875 10.578125 73.976562 10.828125 74.105469 11.109375 C 74.234375 11.394531 74.296875 11.6875 74.296875 11.996094 Z M 74.296875 11.996094 "
            fill-opacity="1"
            fill-rule="nonzero"
          />
          <path
            fill="var(--primary-color)"
            d="M 87.214844 20.214844 C 87.214844 20.671875 87.117188 21.113281 86.929688 21.535156 C 86.738281 21.957031 86.46875 22.332031 86.117188 22.652344 C 85.765625 22.976562 85.359375 23.226562 84.902344 23.402344 C 84.445312 23.578125 83.964844 23.664062 83.46875 23.664062 C 82.972656 23.664062 82.496094 23.578125 82.039062 23.402344 C 81.578125 23.226562 81.175781 22.976562 80.824219 22.652344 C 80.472656 22.332031 80.203125 21.957031 80.011719 21.535156 C 79.820312 21.113281 79.726562 20.671875 79.726562 20.214844 C 79.726562 19.757812 79.820312 19.316406 80.011719 18.894531 C 80.203125 18.46875 80.472656 18.097656 80.824219 17.773438 C 81.175781 17.449219 81.578125 17.199219 82.039062 17.027344 C 82.496094 16.851562 82.972656 16.761719 83.46875 16.761719 C 83.964844 16.761719 84.445312 16.851562 84.902344 17.027344 C 85.359375 17.199219 85.765625 17.449219 86.117188 17.773438 C 86.46875 18.097656 86.738281 18.46875 86.929688 18.894531 C 87.117188 19.316406 87.214844 19.757812 87.214844 20.214844 Z M 87.214844 20.214844 "
            fill-opacity="1"
            fill-rule="nonzero"
          />
        </svg>
        <span class="hidden md:block">Cookie Sanity</span>
        <strong class="block md:hidden text-primary">CS</strong>
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
          <ClientOnly
            ><button
              v-if="screenWidth > 991"
              v-styleclass="{
                selector: '@next',
                enterFromClass: 'hidden',
                enterActiveClass: 'animate-scalein',
                leaveToClass: 'hidden',
                leaveActiveClass: 'animate-fadeout',
                hideOnOutsideClick: true,
              }"
              type="button"
              class="layout-topbar-action"
            >
              <i class="pi pi-palette" /></button
          ></ClientOnly>
          <AppConfigurator />
        </div>

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
