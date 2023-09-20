<script setup lang="ts">
import './styles/global.scss'

const env = $env
</script>

<template>
  <main class="main">
    <VBtn variant="text">Push Notification</VBtn>
    <div>From import.meta.env: {{ env.VAPID_PUBLIC_KEY }}</div>
    <div>From process.env: {{ env.PROCESS_VAPID_PUBLIC_KEY }}</div>
  </main>
</template>

<style scoped>
.main {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100svh;
}
</style>
