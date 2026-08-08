import axiosClient, { extractErrorMessage } from './axiosClient';

// ===== Riwayat notifikasi (jadwal konseling) =====

export async function fetchNotifikasi(nis, limit = 30) {
  const { data } = await axiosClient.get(`/api/notifikasi/${nis}`, { params: { limit } });
  return data; // { notifikasi: [...], unreadCount }
}

export async function tandaiNotifikasiDibaca(id) {
  try {
    const { data } = await axiosClient.put(`/api/notifikasi/${id}/read`);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal menandai notifikasi') };
  }
}

export async function tandaiSemuaNotifikasiDibaca(nis) {
  try {
    const { data } = await axiosClient.put(`/api/notifikasi/${nis}/read-all`);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error, 'Gagal menandai semua notifikasi') };
  }
}

// ===== Web Push subscription =====

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Registrasi service worker (idempotent — aman dipanggil berkali-kali)
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (error) {
    console.error('Gagal mendaftarkan service worker:', error);
    return null;
  }
}

// Minta izin notifikasi browser dan berlangganan Web Push untuk siswa yang login.
// Mengembalikan { success, reason? }
export async function aktifkanPushNotifikasi(nis) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, reason: 'unsupported' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { success: false, reason: 'denied' };
  }

  try {
    const registration = await registerServiceWorker();
    if (!registration) return { success: false, reason: 'unsupported' };

    const { publicKey } = await axiosClient.get('/api/push/vapid-public-key').then((r) => r.data);

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    await axiosClient.post('/api/push/subscribe', { nis, subscription: subscription.toJSON() });
    return { success: true };
  } catch (error) {
    console.error('Gagal mengaktifkan push notification:', error);
    return { success: false, reason: 'error' };
  }
}

export async function nonaktifkanPushNotifikasi() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await axiosClient.post('/api/push/unsubscribe', { endpoint: subscription.endpoint });
      await subscription.unsubscribe();
    }
  } catch (error) {
    console.error('Gagal menonaktifkan push notification:', error);
  }
}