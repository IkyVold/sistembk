// Service worker khusus untuk menerima & menampilkan push notification
// (mis. saat Guru BK mengubah jadwal konseling), termasuk saat tab/app tertutup.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Notifikasi masuk dari server (web-push)
self.addEventListener('push', (event) => {
  // Guard: kalau izin notifikasi belum/tidak diberikan browser (mis. saat push
  // dites manual lewat DevTools sebelum user klik "Aktifkan notifikasi push"),
  // showNotification() akan melempar error. Jangan sampai itu jadi unhandled rejection.
  if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
    console.warn('Push diterima tapi izin notifikasi belum granted, dilewati.');
    return;
  }

  let payload = { title: 'Notifikasi Jadwal Konseling', body: 'Ada pembaruan jadwal konseling Anda.' };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload.body = event.data.text();
    }
  }

  const title = payload.title || 'Notifikasi Jadwal Konseling';
  // `renotify: true` mewajibkan `tag` non-kosong — selalu sediakan fallback
  // supaya tidak error saat payload tidak membawa id (mis. saat dites manual).
  const tag = payload.data?.id ? `notifikasi-${payload.data.id}` : `notifikasi-${Date.now()}`;
  const options = {
    body: payload.body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: payload.data || {},
    tag,
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch((err) => {
      console.error('Gagal menampilkan notifikasi:', err);
    })
  );
});

// Saat notifikasi diklik: fokuskan tab yang sudah terbuka, atau buka tab baru ke halaman Status
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = '/status';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
