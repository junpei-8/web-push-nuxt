var sw=self;console.log("load sw"),sw.addEventListener("push",(function(t){var e,r=null===(e=t.data)||void 0===e?void 0:e.json();if(r){var n=r.title,i=r.body,a=r.icon,l={url:r.url};t.waitUntil(sw.registration.showNotification(n,{body:i,icon:a,data:l}))}}));var targetUrl="",targetOriginUrl="",targetClientUrl="",targetMessage=null;sw.addEventListener("notificationclick",(function(t){t.notification.close();var e=sw.clients;t.waitUntil(e.matchAll({type:"window"}).then((function(r){var n=t.notification.data||{},i=targetOriginUrl=sw.location.origin,a=targetUrl=i+n.url||"";function l(t){return t&&t.focus?t.focus():Promise.resolve(null)}function o(t){return t&&t.navigate?t.navigate(a):Promise.resolve(null)}for(var s=function(t){var e=r[t];if(e.url===a)return targetMessage="type: focusClient",targetClientUrl=e.url,{value:l(e).then(o).then((function(){return function(t){var e;return null===(e=t.postMessage)||void 0===e||e.call(t,{type:"notification-click",url:a}),Promise.resolve(t)}(e)}))}},u=0;u<r.length;u++){var g=s(u);if("object"==typeof g)return g.value}return e.openWindow(a).then((function(t){return targetMessage="type: openWindow",targetClientUrl=(null==t?void 0:t.url)||"",t}))})))})),sw.addEventListener("message",(function(t){var e;t.source&&targetUrl&&(null===(e=t.source)||void 0===e||e.postMessage({type:"message",data:t.data,message:targetMessage,url:targetUrl,clientUrl:targetClientUrl,originUrl:targetOriginUrl}),targetMessage="",targetUrl="",targetClientUrl="",targetOriginUrl="")}));