var sw=self;sw.addEventListener("push",(function(t){var i,n=null===(i=t.data)||void 0===i?void 0:i.json();if(n){var r=n.title,a=n.body,e=n.icon,o={url:n.url};t.waitUntil(sw.registration.showNotification(r,{body:a,icon:e,data:o}))}}));var targetUrl="",targetClientUrl="";sw.addEventListener("notificationclick",(function(t){t.notification.close();var i=sw.clients;t.waitUntil(i.matchAll({type:"window"}).then((function(n){for(var r=t.notification.data||{},a=sw.location.origin,e=a+r.url||"",o=0;o<n.length;o++){var l=n[o];if(l.focus&&l.url.startsWith(a))return targetClientUrl=l.url,l.focus()}return i.openWindow(e)})))})),sw.addEventListener("message",(function(t){var i=t.source;i&&targetUrl&&(i.postMessage({type:"navigation",url:targetUrl,targetClientUrl:targetClientUrl}),targetUrl="")}));