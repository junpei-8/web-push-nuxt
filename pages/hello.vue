<script setup lang="ts">
const { data: greeting } = useLazyFetch('/api/hello')
</script>

<template>
  <h1>{{ greeting?.data || 'ㅤ' }}</h1>
</template>
