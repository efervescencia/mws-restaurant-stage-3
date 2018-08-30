//obteined from: https://developers.google.com/web/fundamentals/primers/service-workers/?hl=es

const CACHE_NAME  = 'mws-cache-v1';
 let urlsToCache = [
'/', 
'index.html',
'css/styles.css',
'js/main.js',
'js/restaurant_info.js',
'js/dbhelper.js',
'js/idb.js',
'img/1.jpg',
'img/2.jpg',
'img/3.jpg',
'img/4.jpg',
'img/5.jpg',
'img/6.jpg',
'img/7.jpg',
'img/8.jpg',
'img/9.jpg',
'img/10.jpg'
];

self.addEventListener('install', function(event) {
  // Instalamos el service worker
  event.waitUntil(caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('cache instalada');
        return cache.addAll(urlsToCache);
      })
  );
});



self.addEventListener('fetch', function(event) {
  event.respondWith(caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});
