<script setup lang="ts">
import './styles/global.scss'
import { subscribeWebPush } from './services/web-push'
</script>

<template>
  <main class="main">
    <VBtn variant="text">Push Notification</VBtn>
    <VBtn variant="text" @click="subscribeWebPush">Subscribe Web Push</VBtn>
  </main>
</template>

<style scoped>
.main {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
  min-height: 100svh;
}
</style>
