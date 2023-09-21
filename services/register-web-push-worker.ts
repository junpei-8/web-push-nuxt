export default async function registerWebPushWorker() {
  if (import.meta.env.SSR) return

  const serviceWorker = navigator.serviceWorker
  if (!serviceWorker) return

  const register = await serviceWorker.register('/_sw/web-push.js', {
    scope: '/_sw/',
  })

  console.log(register)
}
