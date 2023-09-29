<script setup lang="ts">
import '~/styles/global.scss'

import type { WebPushNotificationsPostRequestBody } from '~/server/api/web-push/notifications.post'
import {
  subscribeWebPush,
  subscribeWebPushOnChangeVisibility,
} from '~/services/web-push'
import Toast from './fragments/Toast.vue'
import { appToastStore } from './stores/toast'

onMounted(() => {
  // 起動時に Web Push に登録する
  // NOTE: onMounted の中でしか有効にならない
  // subscribeWebPushWithRequestOnVisibility()
  appToastStore.open('Subscribe を開始しました。')
  subscribeWebPush()
  subscribeWebPushOnChangeVisibility({ withRequest: false })
})

// Web Push Notification を送信する際のカスタムプロップス
const webPushNotificationPostRequestBodyStates =
  ref<WebPushNotificationsPostRequestBody>({
    title: '',
    content: '',
    pathname: '',
  })

/** Web Push Notification を送信しているかどうか */
const isSendingWebPushNotification = ref(false)

/** Web Push Notification を送信する処理 */
async function sendWebPushNotification(event: Event) {
  event.preventDefault()

  if (isSendingWebPushNotification.value) return
  isSendingWebPushNotification.value = true

  const result = await useLazyFetch('/api/web-push/notifications', {
    method: 'POST',
    body: { ...webPushNotificationPostRequestBodyStates.value },
  })

  if (result.error.value) {
    appToastStore.open('Web Push Notification の送信に失敗しました', {
      color: 'error',
    })
  } else {
    appToastStore.open('Web Push Notification を送信しました', {
      color: 'success',
    })
  }

  isSendingWebPushNotification.value = false
}
</script>

<template>
  <main class="main">
    <NuxtPage />

    <div class="web-push-actions">
      <VBtn variant="text" @click="subscribeWebPush">
        Subscribe Device for Web Push
      </VBtn>

      <VDivider />

      <form class="form" @submit="sendWebPushNotification">
        <VTextField
          v-model="webPushNotificationPostRequestBodyStates.title"
          prefix="Title"
          variant="underlined"
          hide-details
        />

        <VTextField
          v-model="webPushNotificationPostRequestBodyStates.content"
          prefix="Content"
          variant="underlined"
          hide-details
        />

        <VSelect
          v-memo="[webPushNotificationPostRequestBodyStates.pathname]"
          v-model="webPushNotificationPostRequestBodyStates.pathname"
          prefix="Pathname"
          variant="underlined"
          hide-details
          :items="['/', '/hello']"
        />

        <VBtn
          type="submit"
          variant="text"
          :disabled="isSendingWebPushNotification"
        >
          Send Notification
        </VBtn>
      </form>
    </div>
  </main>

  <footer class="footer">
    <NuxtLink to="/">TOP</NuxtLink>
    <NuxtLink to="/hello">HELLO</NuxtLink>
  </footer>

  <Toast />
</template>

<style scoped lang="scss">
.main {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  flex-grow: 1;

  :deep(h1) {
    margin-bottom: 48px;
  }
}

.web-push-actions {
  display: flex;
  flex-direction: column;
  align-items: center;

  .v-btn {
    width: 100%;
    height: 48px;
    border-radius: 0;
  }

  .v-divider {
    height: 1px;
    width: 100%;
    margin: 16px 0;
  }

  .form {
    width: 100%;
  }

  .v-text-field {
    :deep(.v-field__input) {
      font-weight: 500;
      padding: 8px 8px 8px 16px;
    }

    :deep(.v-text-field__prefix) {
      opacity: 1;
      padding-top: 8px;
      padding-bottom: 8px;
      padding-left: 8px;
    }

    :deep(.v-text-field__prefix__text) {
      position: relative;
      min-width: 4.8em;
      font-size: 0.8em;
      font-weight: bold;

      &::after {
        content: ':';
        position: absolute;
        right: 0;
        height: 100%;
      }
    }
  }
}

.footer {
  display: flex;
  align-items: center;
  gap: 32px;
  height: 48px;

  a {
    padding: 8px 16px;
    font-size: 14px;
    font-weight: bold;
    text-decoration: none;
    color: inherit;
  }
}
</style>
./app-state
