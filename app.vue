<script setup lang="ts">
import './styles/global.scss'

const VAPID_PUBLIC_KEY = $env.VAPID_PUBLIC_KEY

const { data: hello } = useFetch('/api/hello')
</script>

<template>
  <main class="main">
    <VBtn variant="text">Push Notification</VBtn>
    <div>From import_meta_env: {{ VAPID_PUBLIC_KEY }}</div>
    <div>{{ hello?.greeting }}</div>
  </main>
</template>

<style scoped>
.main {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100svh;
}
</style>
