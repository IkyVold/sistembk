import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  fetchNotifikasi,
  tandaiNotifikasiDibaca,
  tandaiSemuaNotifikasiDibaca,
} from '../api/notifikasiService';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Mengelola riwayat notifikasi perubahan jadwal konseling untuk siswa yang sedang login:
 * - Memuat riwayat awal dari REST API
 * - Menyambung ke Socket.IO untuk notifikasi real-time saat Guru BK mengubah jadwal
 * - Melacak jumlah notifikasi belum dibaca (untuk badge ikon lonceng)
 */
export default function useNotifikasiJadwal(nis) {
  const [notifikasi, setNotifikasi] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!nis) {
      setNotifikasi([]);
      setUnreadCount(0);
      setLoading(false);
      return undefined;
    }

    let isMounted = true;
    setLoading(true);

    fetchNotifikasi(nis)
      .then(({ notifikasi: list, unreadCount: count }) => {
        if (!isMounted) return;
        setNotifikasi(list);
        setUnreadCount(count);
      })
      .catch((err) => console.error('Gagal memuat notifikasi:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    function joinRoom() {
      socket.emit('join-siswa-notif', { nis });
    }

    socket.on('connect', joinRoom);
    socket.on('reconnect', joinRoom);

    socket.on('notifikasi-baru', (data) => {
      if (!isMounted) return;
      setNotifikasi((prev) => [
        {
          id: data.id,
          konselingId: data.konselingId,
          tipe: data.tipe,
          judul: data.judul,
          pesan: data.pesan,
          tanggalLama: data.tanggalLama,
          jamLama: data.jamLama,
          tanggalBaru: data.tanggalBaru,
          jamBaru: data.jamBaru,
          isRead: false,
          createdAt: data.createdAt,
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      isMounted = false;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [nis]);

  const tandaiDibaca = useCallback(async (id) => {
    setNotifikasi((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    const result = await tandaiNotifikasiDibaca(id);
    if (!result.success) console.error(result.error);
  }, []);

  const tandaiSemuaDibaca = useCallback(async () => {
    if (!nis) return;
    setNotifikasi((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    const result = await tandaiSemuaNotifikasiDibaca(nis);
    if (!result.success) console.error(result.error);
  }, [nis]);

  return { notifikasi, unreadCount, loading, tandaiDibaca, tandaiSemuaDibaca };
}