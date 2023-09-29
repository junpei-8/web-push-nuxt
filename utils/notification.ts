export const IS_SUPPORTED_NOTIFICATION = typeof Notification !== 'undefined'

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API - Notification API
 * @see https://developer.mozilla.org/ja/docs/Web/API/Notification/requestPermission_static - Notification.requestPermission()
 */
export function requestNotificationPermission(): Promise<NotificationPermission> {
  const permission = Notification.permission
  if (permission !== 'default') return Promise.resolve(permission)
  return new Promise((resolve) => Notification.requestPermission(resolve))
}
