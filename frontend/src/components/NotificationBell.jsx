import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import useNotifikasiJadwal from '../hooks/useNotifikasiJadwal';
import { aktifkanPushNotifikasi, registerServiceWorker } from '../api/notifikasiService';
import '../styles/notifikasiBell.css';

function formatWaktuRelatif(isoString) {
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffJam = Math.floor(diffMin / 60);
  if (diffJam < 24) return `${diffJam} jam lalu`;
  const diffHari = Math.floor(diffJam / 24);
  if (diffHari < 7) return `${diffHari} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotificationBell() {
  const { siswa } = useAuth();
  const { notifikasi, unreadCount, loading, tandaiDibaca, tandaiSemuaDibaca } = useNotifikasiJadwal(siswa?.nis);
  const [open, setOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState('default'); // default | granted | denied | unsupported
  const panelRef = useRef(null);

  useEffect(() => {
    registerServiceWorker();
    if (typeof Notification !== 'undefined') {
      setPushStatus(Notification.permission);
    } else {
      setPushStatus('unsupported');
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  async function handleAktifkanPush() {
    const result = await aktifkanPushNotifikasi(siswa?.nis);
    if (result.success) {
      setPushStatus('granted');
    } else if (result.reason === 'denied') {
      setPushStatus('denied');
      alert('Izin notifikasi ditolak. Aktifkan lewat pengaturan browser jika ingin menerima notifikasi push.');
    } else if (result.reason === 'unsupported') {
      alert('Perangkat/browser ini tidak mendukung push notification.');
    } else {
      alert('Gagal mengaktifkan notifikasi push. Coba lagi nanti.');
    }
  }

  function handleItemClick(item) {
    if (!item.isRead) tandaiDibaca(item.id);
  }

  return (
    <div className="notif-bell-wrap" ref={panelRef}>
      <button
        className="notif-bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifikasi jadwal konseling"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      <div className={`notif-panel ${open ? 'show' : ''}`}>
        <div className="notif-panel-header">
          <span>Riwayat Notifikasi</span>
          {unreadCount > 0 && (
            <button className="notif-mark-all" onClick={tandaiSemuaDibaca}>
              Tandai semua dibaca
            </button>
          )}
        </div>

        {pushStatus === 'default' && (
          <button className="notif-enable-push" onClick={handleAktifkanPush}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Aktifkan notifikasi push
          </button>
        )}

        <div className="notif-list">
          {loading && <div className="notif-empty">Memuat notifikasi...</div>}

          {!loading && notifikasi.length === 0 && (
            <div className="notif-empty">Belum ada notifikasi jadwal konseling.</div>
          )}

          {!loading &&
            notifikasi.map((item) => (
              <button
                key={item.id}
                className={`notif-item ${item.isRead ? '' : 'unread'}`}
                onClick={() => handleItemClick(item)}
              >
                <div className="notif-item-dot" />
                <div className="notif-item-body">
                  <div className="notif-item-title">{item.judul}</div>
                  <div className="notif-item-msg">{item.pesan}</div>
                  <div className="notif-item-time">{formatWaktuRelatif(item.createdAt)}</div>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
