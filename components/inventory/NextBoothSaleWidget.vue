<script setup lang="ts">
  const boothsStore = useBoothsStore();
  const router = useRouter();

  const nextBoothSale = computed(() => {
    const upcoming = boothsStore.upcomingBoothSales;
    if (upcoming && upcoming.length > 0) {
      return upcoming[0];
    }
    return null;
  });

  const navigateToBoothSales = () => {
    router.push('/booth-sales');
  };
</script>

<template>
  <div
    class="card cursor-pointer hover:shadow-lg transition-shadow"
    @click="navigateToBoothSales"
  >
    <div class="flex items-center gap-4">
      <div class="flex-shrink-0">
        <i class="pi pi-calendar text-4xl text-primary" />
      </div>
      <div class="flex-grow">
        <h5 class="mb-2">Next Booth Sale</h5>
        <div v-if="nextBoothSale" class="text-gray-700">
          <p class="text-lg font-semibold mb-1">
            {{ nextBoothSale.location }}
          </p>
          <p class="text-sm">
            <i class="pi pi-calendar mr-2" />
            <NuxtTime :datetime="nextBoothSale.sale_date" time-zone="UTC" />
          </p>
          <p class="text-sm">
            <i class="pi pi-clock mr-2" />
            {{ nextBoothSale.sale_time }}
          </p>
        </div>
        <div v-else class="text-gray-500">
          <p>No booth sales scheduled</p>
        </div>
      </div>
      <div class="flex-shrink-0">
        <i class="pi pi-chevron-right text-2xl text-gray-400" />
      </div>
    </div>
  </div>
</template>
