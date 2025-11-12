<script setup lang="ts">
  import { useCookiesStore } from '@/stores/cookies';
  import { DataTable } from 'primevue';
  const cookiesStore = useCookiesStore();
  const formatHelpers = useFormatHelpers();

  const props = defineProps<{
    cookies: Record<string, number>;
  }>();

  const totalCookies = (cookies: Record<string, number>) => {
    return cookiesStore.allCookies.reduce((total, cookie) => {
      const count = cookies[cookie.abbreviation] ?? 0;
      return count ? total + count : total;
    }, 0);
  };

  const cookiesByCasesAndPackages = computed(() => {
    const packagesPerCase = 12;
    const counts = props.cookies;
    return cookiesStore.allCookies.reduce<
      Record<string, { cases: number | null; packages: number | null }>
    >((acc, cookie) => {
      const count = counts[cookie.abbreviation] ?? 0;
      if (count === 0) return acc;
      const cases =
        Math.abs(count) >= packagesPerCase
          ? count >= 0
            ? Math.floor(count / packagesPerCase)
            : Math.ceil(count / packagesPerCase)
          : null;
      let packages = cases !== null ? count - cases * packagesPerCase : count;
      packages = packages === 0 ? null : packages;

      acc[cookie.abbreviation] = { cases, packages };
      return acc;
    }, {});
  });

  const totalPackages = computed(() => {
    return Object.values(cookiesByCasesAndPackages.value).reduce(
      (total, cur) => total + (cur?.packages ?? 0),
      0,
    );
  });

  const totalCases = computed(() => {
    return Object.values(cookiesByCasesAndPackages.value).reduce(
      (total, cur) => total + (cur?.cases ?? 0),
      0,
    );
  });
</script>

<template>
  <DataTable
    :value="cookiesStore.allCookies"
    data-key="id"
    sort-field="order"
    size="small"
    show-gridlines
  >
    <Column header="NO. OF CASES.">
      <template #body="slotProps">
        {{ cookiesByCasesAndPackages[slotProps.data.abbreviation]?.cases }}
      </template>
    </Column>
    <Column header="NO. OF PKGS.">
      <template #body="slotProps">
        {{ cookiesByCasesAndPackages[slotProps.data.abbreviation]?.packages }}
      </template>
    </Column>
    <Column field="name" header="VARIETIES">
      <template #body="slotProps">
        {{ slotProps.data.name }} ({{
          formatHelpers.formatCurrency(slotProps.data.price)
        }})
      </template>
    </Column>
    <ColumnGroup type="footer">
      <Row>
        <Column :footer="totalCases" />
        <Column :footer="totalPackages" />
        <Column :footer="`Total: ${totalCookies(props.cookies)} packages`" />
      </Row>
    </ColumnGroup>
  </DataTable>
</template>
