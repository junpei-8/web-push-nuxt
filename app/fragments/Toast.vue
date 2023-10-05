<script setup lang="ts">
import { appToastStore } from '../stores/toast'

const toasts = appToastStore.elements
</script>

<template>
  <ClientOnly>
    <template v-for="toast in toasts" :key="toast.id">
      <VSnackbar v-bind="toast.props">
        <span class="message">
          {{ toast.message }}
        </span>

        <template #actions>
          <VBtn size="32" icon="$close" @click="toast.close" class="button" />
        </template>
      </VSnackbar>
    </template>
  </ClientOnly>
</template>

<style lang="scss" scoped>
:deep(.v-overlay__content) {
  min-width: 0;
  min-height: 0;
}

:deep(.v-snackbar__content) {
  padding-right: 8px;
}

.message {
  font-weight: bold;
}
</style>
