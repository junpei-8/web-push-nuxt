<script setup lang="ts">
import './styles/global.scss'
import {
  sendWebPush,
  subscribeWebPush,
  subscribeWebPushWithRequest,
} from './services/web-push'

subscribeWebPush()
</script>

<template>
  <main class="main">
    <VBtn variant="text" @click="sendWebPush">Push Notification</VBtn>
    <VBtn variant="text" @click="subscribeWebPushWithRequest"
      >Subscribe Web Push</VBtn
    >
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
