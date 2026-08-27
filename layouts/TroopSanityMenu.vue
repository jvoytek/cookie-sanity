<script setup>
  import AppMenuItem from './AppMenuItem.vue';
</script>

<template>
  <ul class="layout-menu">
    <template
      v-for="(item, i) in [
        {
          items: [
            {
              label: 'Girls',
              icon: 'pi pi-fw pi-face-smile',
              to: '/troop-sanity/girls',
            },
            {
              label: 'Adults',
              icon: 'pi pi-fw pi-users',
              to: '/troop-sanity/adults',
            },
            {
              label: 'Collaborators',
              icon: 'pi pi-fw pi-share-alt',
              to: '/troop-sanity/collaborators',
            },
            {
              label: 'Forms',
              icon: 'pi pi-fw pi-file',
              to: '/troop-sanity/forms',
            },
            {
              label: 'Events',
              icon: 'pi pi-fw pi-calendar',
              to: '/troop-sanity/events',
            },
            {
              label: 'Cookie Sanity',
              icon: 'pi pi-fw pi-external-link',
              url: '/',
            },
          ],
        },
      ]"
      :key="item"
    >
      <app-menu-item v-if="!item.separator" :item="item" :index="i" />
      <li v-if="item.separator" class="menu-separator" />
    </template>
  </ul>
</template>

<style lang="scss" scoped></style>
