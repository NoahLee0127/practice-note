// 매일매일 연습일기 서비스워커 — 오프라인 실행용 캐시
// 배포 파일을 수정하면 CACHE_VERSION을 올려야 사용자 기기에 새 버전이 반영됩니다.
const CACHE_VERSION = 'practice-note-v8.3.0';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 페이지는 네트워크 우선(최신 버전 반영) → 실패 시 캐시, 아이콘 등은 캐시 우선.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
