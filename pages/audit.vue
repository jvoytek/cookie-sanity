<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12">
      <div class="card">
        <h1 class="text-2xl font-semibold mb-4">Audit Page</h1>
        <p class="text-muted-color mb-4">
          Upload and compare Smart Cookies data exports with Cookie Sanity
          records to identify discrepancies.
        </p>
      </div>
    </div>
    <div class="col-span-12">
      <AuditFileUpload />
    </div>
  </div>
</template>
