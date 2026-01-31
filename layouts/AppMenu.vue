<script setup>
  import AppMenuItem from './AppMenuItem.vue';

  const transactionsStore = useTransactionsStore();
  const girlsStore = useGirlsStore();

  const requestedCount = computed(
    () => transactionsStore.requestedGirlTransactionrListCount,
  );

  const girlDashboardItems = computed(() => {
    return girlsStore.allGirls.map((girl) => ({
      label: `${girl.first_name} ${girl.last_name[0]}.`,
      icon: 'pi pi-fw pi-user',
      to: `/girl-dashboard/${girl.id}`,
    }));
  });

  const model = ref([
    {
      items: [
        { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' },
        {
          label: 'Troop Inventory',
          icon: 'pi pi-fw pi-box',
          to: '/troop-inventory',
        },
        {
          label: 'Girl Inventory',
          icon: 'pi pi-fw pi-arrow-right-arrow-left',
          to: '/girl-inventory',
          badge: requestedCount,
          badgeSeverity: 'danger',
        },
        {
          label: 'Physical Inventory Check',
          icon: 'pi pi-fw pi-clipboard',
          to: '/physical-inventory-check',
        },

        {
          label: 'Booth Sales',
          icon: 'pi pi-fw pi-calendar',
          to: '/booth-sales',
        },
        {
          label: 'Account Management',
          icon: 'pi pi-fw pi-wallet',
          to: '/accounts',
        },
        {
          label: 'Bank Deposits',
          icon: 'pi pi-fw pi-building-columns',
          to: '/bank-deposits',
        },
        {
          label: 'Audit',
          icon: 'pi pi-fw pi-file-check',
          to: '/audit',
        },
        {
          label: 'Girl Dashboards',
          icon: 'pi pi-fw pi-chart-line',
          items: girlDashboardItems,
        },
        {
          label: 'Season Settings',
          icon: 'pi pi-fw pi-cog',
          items: [
            { label: 'Girls', icon: 'pi pi-fw pi-face-smile', to: '/girls' },
            { label: 'Cookies', icon: 'pi pi-fw pi-box', to: '/cookies' },
            {
              label: 'Collaborators',
              icon: 'pi pi-fw pi-users',
              to: '/collaborators',
            },
          ],
        },
      ],
    },
  ]);
</script>

<template>
  <ul class="layout-menu">
    <template v-for="(item, i) in model" :key="item">
      <app-menu-item v-if="!item.separator" :item="item" :index="i" />
      <li v-if="item.separator" class="menu-separator" />
    </template>
  </ul>
</template>

<style lang="scss" scoped></style>
