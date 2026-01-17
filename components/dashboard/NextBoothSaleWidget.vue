<script setup lang="ts">
  const boothsStore = useBoothsStore();
  const girlsStore = useGirlsStore();
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
      <div class="flex-grow">
        <h5 class="mb-2"><i class="pi pi-calendar" /> Next Booth Sale</h5>
        <div v-if="nextBoothSale" class="text-gray-700">
          <p>
            <strong>{{ nextBoothSale.location }}</strong>
            <br />
            <NuxtTime
              :datetime="nextBoothSale.sale_date"
              weekday="short"
              year="numeric"
              month="short"
              day="numeric"
              time-zone="UTC"
            />
            <span v-if="nextBoothSale.start_time">
              - {{ nextBoothSale.start_time }}
              <span v-if="nextBoothSale.end_time">
                to {{ nextBoothSale.end_time }}
              </span>
            </span>
            <br />
            <strong>Scouts Attending:</strong>
            <br />
            <span v-for="scout in nextBoothSale.scouts_attending" :key="scout">
              {{ girlsStore.getGirlNameById(scout) }}<br />
            </span>
          </p>
        </div>
        <div v-else class="text-gray-500">
          <p>No booth sales scheduled</p>
        </div>
      </div>
    </div>
  </div>
</template>
