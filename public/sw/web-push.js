var sw=self;sw.addEventListener("push",(function(n){var t,i=null===(t=n.data)||void 0===t?void 0:t.json();if(i){var o=i.title,e=i.body,r=i.icon,a={url:i.url};n.waitUntil(sw.registration.showNotification(o,{body:e,icon:r,data:a}))}})),sw.addEventListener("notificationclick",(function(n){n.notification.close();var t=sw.clients;n.waitUntil(t.matchAll({type:"window",includeUncontrolled:!0}).then((function(i){var o=n.notification.data||{},e=sw.location.origin+o.url||"";function r(n){return n&&n.focus?n.focus():Promise.resolve(null)}function a(n){return n&&n.navigate?n.navigate(e):Promise.resolve(null)}for(var l=function(n){var t=i[n];if(t.url===e)return{value:r(t).then(a).then((function(){return function(n){var t;return null===(t=n.postMessage)||void 0===t||t.call(n,{type:"notification-click",url:e}),Promise.resolve(n)}(t)}))}},u=0;u<i.length;u++){var c=l(u);if("object"==typeof c)return c.value}return t.openWindow(e).then(r)})))}));