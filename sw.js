/* QALA PVL: сервис-воркер. Сеть в приоритете, офлайн показывает последнюю загруженную страницу. Также принимает push-уведомления. */
var C="qala-shell-4",S="qala-sdk-1";
self.addEventListener("install",function(e){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C&&x!==S}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener("fetch",function(e){
  var r=e.request;if(r.method!=="GET")return;var u=new URL(r.url);
  /* Firebase SDK: версия зафиксирована в адресе, поэтому кладём в кэш навсегда, повторные открытия быстрые даже на слабой сети */
  if(u.hostname==="www.gstatic.com"&&u.pathname.indexOf("/firebasejs/")===0){
    e.respondWith(caches.open(S).then(function(c){return c.match(r).then(function(m){return m||fetch(r).then(function(res){if(res.ok)c.put(r,res.clone());return res})})}));return}
  if(u.origin!==location.origin)return;
  if(/version\.json$/.test(u.pathname))return;
  /* Сайт: сразу показываем сохранённую копию и в фоне обновляем её; о новой версии сообщит плашка обновления */
  e.respondWith(caches.open(C).then(function(c){return c.match(r).then(function(m){
    var f=fetch(r,{cache:"no-cache"}).then(function(res){if(res.ok)c.put(r,res.clone());return res}).catch(function(){return m||c.match("./")});
    e.waitUntil(f.catch(function(){}));return m||f})}))});
self.addEventListener("push",function(e){
  var d={};try{d=e.data.json()}catch(x){try{d={data:{body:e.data.text()}}}catch(y){}}
  var n=d.notification||{},dd=d.data||{},title=dd.title||n.title||"QALA PVL",body=dd.body||n.body||"";
  e.waitUntil(self.registration.showNotification(title,{body:body,icon:"icon-192.png",badge:"icon-192.png",data:{route:dd.route||"#/profile"}}))});
self.addEventListener("notificationclick",function(e){
  e.notification.close();var route=(e.notification.data&&e.notification.data.route)||"#/";
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(function(l){var base=self.registration.scope;
    for(var i=0;i<l.length;i++){if(l[i].url.indexOf(base)===0){l[i].focus();l[i].postMessage({route:route});return}}
    return clients.openWindow(base+route)}))});
