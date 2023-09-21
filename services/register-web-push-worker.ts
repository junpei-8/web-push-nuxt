export default async function registerWebPushWorker() {
  if (import.meta.env.SSR) return

  const serviceWorker = navigator.serviceWorker
  if (!serviceWorker) return

  const register = await serviceWorker.register('/sw/web-push.js', {
    scope: '/sw/',
  })

  console.log(register)
}
