<script setup lang="ts">
import './styles/global.scss'
import registerWebPushWorker from './services/register-web-push-worker'

registerWebPushWorker()
</script>

<template>
  <main class="main">
    <VBtn variant="text">Push Notification</VBtn>
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
