import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { activateRoleToken, getToken } from '../../api/tokenStore';
import { uploadFotoGuruBk, deleteFotoGuruBk } from '../../api/akunService';
import { mediaUrl } from '../../utils/mediaUrl';
import { fetchNotifikasiGuru, tandaiSemuaNotifikasiGuruDibaca } from '../../api/notifikasiService';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
import Sidebar from './components/Sidebar';
import KonselingTab from './KonselingTab';
import SiswaTab from './SiswaTab';
import InformasiTab from './InformasiTab';
import DetailModal from './modals/DetailModal';
import LaporanModal from './modals/LaporanModal';
import LaporanDetailModal from './modals/LaporanDetailModal';
import WalkinModal from './modals/WalkinModal';
import TambahSiswaModal from './modals/TambahSiswaModal';
import ImportSiswaModal from './modals/ImportSiswaModal';
import ImportAbsenModal from './modals/ImportAbsenModal';
import RiwayatKelasModal from './modals/RiwayatKelasModal';
import InformasiModal from './modals/InformasiModal';
import { mapKonselingRow, formatTanggal } from './helpers';
import { sessionIdFromKonselingId } from '../../utils/chatSession';
import {
  fetchKonselingByGuru,
  konfirmasiJadwalKonseling,
  ubahStatusKonseling,
  simpanLaporanKonseling,
  buatSesiLanjutan,
  simpanWalkinKonseling,
} from './api/konselingService';
import { fetchAllSiswa, tambahSiswaManual } from './api/siswaService';
import { fetchAllInformasi, simpanInformasi, hapusInformasi } from './api/informasiService';
import './guruBk.css';

export default function GuruBkDashboard() {
  const navigate = useNavigate();
  const auth = useAuth();

    // Profil guru dari session login (backend) — nama dipakai filter konseling
  const currentGuru = useMemo(() => {
    if (!auth.guru) return null;
    const g = auth.guru;
    return {
      ...g,
      avatar: g.avatar || (g.nama ? g.nama.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() : 'GB'),
    };
  }, [auth.guru]);

  // Aktifkan role guru untuk header X-Auth-Role (JWT ada di HttpOnly cookie)
  useEffect(() => {
    if (auth.guru) {
      activateRoleToken('guru');
    }
  }, [auth.guru]);

  // ==================== KONSELING STATE ====================
  const [semuaKonseling, setSemuaKonseling] = useState([]);
  const [isLoadingKonseling, setIsLoadingKonseling] = useState(true);
  const [activeTab, setActiveTab] = useState('konseling');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterTahun, setFilterTahun] = useState('');

  const [detailItemId, setDetailItemId] = useState(null);
  const [laporanItemId, setLaporanItemId] = useState(null);
  const [laporanDetailItemId, setLaporanDetailItemId] = useState(null);
  const [showWalkinModal, setShowWalkinModal] = useState(false);

  // ==================== SISWA STATE ====================
  const [semuaSiswa, setSemuaSiswa] = useState([]);
  const [isLoadingSiswa, setIsLoadingSiswa] = useState(false);
  const [siswaLoaded, setSiswaLoaded] = useState(false);
  const [siswaLoadError, setSiswaLoadError] = useState(false);
  const [siswaSearch, setSiswaSearch] = useState('');
  const [siswaFilterKelas, setSiswaFilterKelas] = useState('');
  const [siswaFilterJK, setSiswaFilterJK] = useState('');
  const [showTambahSiswaModal, setShowTambahSiswaModal] = useState(false);
  const [showImportSiswaModal, setShowImportSiswaModal] = useState(false);
  const [showImportAbsenModal, setShowImportAbsenModal] = useState(false);
  const [riwayatKelasSiswa, setRiwayatKelasSiswa] = useState(null);

  // ==================== INFORMASI STATE ====================
  const [semuaInformasi, setSemuaInformasi] = useState([]);
  const [isLoadingInformasi, setIsLoadingInformasi] = useState(false);
  const [informasiLoaded, setInformasiLoaded] = useState(false);
  const [informasiLoadError, setInformasiLoadError] = useState(false);
  const [informasiSearch, setInformasiSearch] = useState('');
  const [informasiFilterKategori, setInformasiFilterKategori] = useState('');
  const [showInformasiModal, setShowInformasiModal] = useState(false);
  const [editingInformasi, setEditingInformasi] = useState(null);

  // ==================== LOAD KONSELING ====================
  const loadSemuaKonseling = useCallback(async (guru) => {
    setIsLoadingKonseling(true);
    try {
      const rows = await fetchKonselingByGuru(guru.nama);
      setSemuaKonseling(rows.map((row) => mapKonselingRow(row, guru)));
    } catch (e) {
      console.error('Gagal memuat data konseling dari server:', e);
      setSemuaKonseling([]);
      alert('⚠️ Gagal memuat data konseling dari server. Pastikan backend berjalan.');
    } finally {
      setIsLoadingKonseling(false);
    }
  }, []);

  useEffect(() => {
    if (!currentGuru) {
      alert('Data guru tidak ditemukan!');
      navigate('/login-guru');
      return;
    }
    loadSemuaKonseling(currentGuru);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGuru]);

  // ===== Notifikasi realtime Guru BK (pengajuan baru / batal siswa) =====
  const [guruNotifUnread, setGuruNotifUnread] = useState(0);
  const [guruNotifList, setGuruNotifList] = useState([]);
  const [guruNotifOpen, setGuruNotifOpen] = useState(false);
  const [guruNotifToast, setGuruNotifToast] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!currentGuru?.username) return undefined;

    // Muat riwayat + unread awal
    fetchNotifikasiGuru(currentGuru.username)
      .then(({ notifikasi, unreadCount }) => {
        setGuruNotifList(Array.isArray(notifikasi) ? notifikasi : []);
        setGuruNotifUnread(unreadCount || 0);
      })
      .catch((err) => console.warn('Gagal muat notifikasi guru:', err));

    activateRoleToken('guru');
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: { role: 'guru', token: getToken() || undefined },
    });
    socketRef.current = socket;

    const joinRoom = () => {
      socket.emit('join-guru-notif', { username: currentGuru.username });
    };
    socket.on('connect', joinRoom);
    socket.on('reconnect', joinRoom);

    socket.on('notifikasi-guru-baru', (payload) => {
      const item = {
        id: payload?.id,
        konselingId: payload?.konselingId,
        tipe: payload?.tipe,
        judul: payload?.judul || 'Notifikasi baru',
        pesan: payload?.pesan || '',
        isRead: false,
        createdAt: payload?.createdAt || new Date().toISOString(),
      };
      setGuruNotifList((prev) => [item, ...prev].slice(0, 30));
      setGuruNotifUnread((c) => c + 1);
      setGuruNotifToast({ judul: item.judul, pesan: item.pesan });
      loadSemuaKonseling(currentGuru);
      setTimeout(() => setGuruNotifToast(null), 6000);
    });

    return () => {
      socket.off('notifikasi-guru-baru');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentGuru, loadSemuaKonseling]);

  async function handleClearGuruNotif() {
    if (!currentGuru?.username) return;
    await tandaiSemuaNotifikasiGuruDibaca(currentGuru.username);
    setGuruNotifUnread(0);
    setGuruNotifList((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  // Notifikasi di judul tab browser
  const prosesCount = useMemo(
    () => semuaKonseling.filter((item) => item.status === 'Proses' && item.statusKonfirmasi !== 'Terkonfirmasi').length,
    [semuaKonseling]
  );
  useEffect(() => {
    const badge = Math.max(prosesCount, guruNotifUnread);
    document.title = badge > 0 ? `(${badge}) Dashboard Guru BK - Stop Bullying` : 'Dashboard Guru BK - Stop Bullying';
  }, [prosesCount, guruNotifUnread]);

  const stats = useMemo(() => {
    const total = semuaKonseling.length;
    const proses = prosesCount;
    const terkonfirmasi = semuaKonseling.filter(
      (item) => item.statusKonfirmasi === 'Terkonfirmasi' && item.status !== 'Selesai' && item.status !== 'Dibatalkan'
    ).length;
    const selesai = semuaKonseling.filter((item) => item.status === 'Selesai').length;
    const dibatalkan = semuaKonseling.filter((item) => item.status === 'Dibatalkan').length;
    return { total, proses, terkonfirmasi, selesai, dibatalkan };
  }, [semuaKonseling, prosesCount]);

  const tahunAjaranOptions = useMemo(() => {
    const set = new Set();
    semuaKonseling.forEach((item) => {
      if (item.tahunAjaran && item.tahunAjaran !== '-') set.add(item.tahunAjaran);
    });
    return Array.from(set).sort();
  }, [semuaKonseling]);

  const konselingByFilter = useMemo(() => {
    switch (currentFilter) {
      case 'proses':
        return semuaKonseling.filter((item) => item.status === 'Proses' && item.statusKonfirmasi !== 'Terkonfirmasi');
      case 'terkonfirmasi':
        return semuaKonseling.filter(
          (item) => item.statusKonfirmasi === 'Terkonfirmasi' && item.status !== 'Selesai' && item.status !== 'Dibatalkan'
        );
      case 'selesai':
        return semuaKonseling.filter((item) => item.status === 'Selesai');
      case 'dibatalkan':
        return semuaKonseling.filter((item) => item.status === 'Dibatalkan');
      default:
        return semuaKonseling;
    }
  }, [semuaKonseling, currentFilter]);

  const filteredKonseling = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return konselingByFilter.filter((item) => {
      const matchSearch =
        !term ||
        (item.namaSiswa || '').toLowerCase().includes(term) ||
        (item.nisnSiswa || '').toLowerCase().includes(term) ||
        (item.deskripsi || '').toLowerCase().includes(term);
      const matchKelas = !filterKelas || item.kelasSiswa === filterKelas;
      const matchTahun = !filterTahun || item.tahunAjaran === filterTahun;
      return matchSearch && matchKelas && matchTahun;
    });
  }, [konselingByFilter, searchTerm, filterKelas, filterTahun]);

  const detailItem = useMemo(
    () => semuaKonseling.find((item) => item.id === detailItemId) || null,
    [semuaKonseling, detailItemId]
  );
  const laporanItem = useMemo(
    () => semuaKonseling.find((item) => item.id === laporanItemId) || null,
    [semuaKonseling, laporanItemId]
  );
  const laporanDetailItem = useMemo(
    () => semuaKonseling.find((item) => item.id === laporanDetailItemId) || null,
    [semuaKonseling, laporanDetailItemId]
  );

  // ==================== KONSELING HANDLERS ====================
  function handleSelectFilter(filterKey) {
    setCurrentFilter(filterKey);
    setActiveTab('konseling');
  }

  function handleOpenDetail(id) {
    setDetailItemId(id);
  }

  async function handleKonfirmasi(item, { tanggal, jam }) {
    if (!tanggal || !jam) {
      alert('❌ Silakan pilih tanggal dan jam konfirmasi terlebih dahulu!');
      return;
    }

    let konfirmasi = true;
    if (item.tanggalRaw !== tanggal || item.jam !== jam) {
      konfirmasi = confirm(
        `⚠️ PERUBAHAN JADWAL KONSELING\n\n` +
          `Jadwal Diajukan Siswa:\n📅 Tanggal: ${item.tanggal}\n⏰ Jam: ${item.jam}\n\n` +
          `Jadwal Konfirmasi Guru BK:\n📅 Tanggal: ${formatTanggal(tanggal)}\n⏰ Jam: ${jam}\n\n` +
          `Siswa akan melihat jadwal yang sudah dikonfirmasi ini.\nApakah Anda yakin ingin memkonfirmasi jadwal ini?`
      );
    }
    if (!konfirmasi) return;

    const res = await konfirmasiJadwalKonseling(item.id, { tanggal, jam });
    if (res.success) {
      await loadSemuaKonseling(currentGuru);
      setDetailItemId(null);
      alert(
        '✅ Jadwal berhasil dikonfirmasi!\n\nSiswa sekarang dapat melihat jadwal yang sudah dikonfirmasi.\n\nSetelah sesi konseling selesai, jangan lupa untuk membuat laporan hasil konseling.'
      );
    } else {
      alert(`❌ Gagal memkonfirmasi jadwal: ${res.error}`);
    }
  }

  async function handleBatal(itemOrId) {
    const id = typeof itemOrId === 'object' ? itemOrId.id : itemOrId;
    const pesan =
      '⚠️ Anda akan membatalkan konseling ini.\n\nAlasan pembatalan akan terlihat oleh siswa.\n\nLanjutkan?';
    if (!confirm(pesan)) return;

    const res = await ubahStatusKonseling(id, 'Dibatalkan');
    if (res.success) {
      await loadSemuaKonseling(currentGuru);
      setDetailItemId(null);
      alert('✅ Status berhasil diubah menjadi "Dibatalkan"');
    } else {
      alert(`❌ Gagal mengubah status: ${res.error}`);
    }
  }

  function handleOpenLaporan(id) {
    const item = semuaKonseling.find((k) => k.id === id);
    if (!item) return;
    if (item.laporanGuru && !item.canEditLaporan) {
      alert(
        `🔒 Laporan ini sudah terkunci — sudah lewat 72 jam sejak pertama kali disimpan, jadi tidak bisa diedit lagi.`
      );
      return;
    }
    setLaporanItemId(id);
    setDetailItemId(null);
  }

  async function handleSaveLaporan(id, payload) {
    const { buatLanjutan, lanjutan, ...laporanPayload } = payload;
    const res = await simpanLaporanKonseling(id, { ...laporanPayload, dibuatOleh: currentGuru.nama });
    if (!res.success) {
      alert(`❌ Terjadi kesalahan saat menyimpan laporan: ${res.error}`);
      return;
    }

    let lanjutanMsg = '';
    if (buatLanjutan && lanjutan) {
      const item = semuaKonseling.find((k) => k.id === id);
      const lanRes = await buatSesiLanjutan({
        pengajuan_sebelumnya_id: id,
        tanggal: lanjutan.tanggal,
        jam: lanjutan.jam,
        jenis: lanjutan.jenis,
        kategori: lanjutan.kategori || item?.kategori,
        deskripsi: lanjutan.deskripsi,
        guru_bk: currentGuru.nama,
      });
      if (lanRes.success) {
        lanjutanMsg = `\n\n🔗 Sesi lanjutan #${lanRes.data.id} berhasil dibuat (terhubung ke sesi #${id}).`;
      } else {
        lanjutanMsg = `\n\n⚠️ Laporan tersimpan, tetapi gagal membuat sesi lanjutan: ${lanRes.error}`;
      }
    }

    await loadSemuaKonseling(currentGuru);
    setLaporanItemId(null);
    const edited = res.data.edited;
    alert(
      `✅ ${res.data.message}${edited ? '' : '\n\nStatus konseling telah diubah menjadi Selesai.'}${lanjutanMsg}`
    );
  }

  function handleLihatLaporan(id) {
    setLaporanDetailItemId(id);
  }

  async function handleChat(id) {
    const item = semuaKonseling.find((k) => k.id === id);
    if (!item) {
      alert('Data konseling tidak ditemukan!');
      return;
    }
    if (item.jenis !== 'Daring') {
      alert('Chat hanya tersedia untuk konseling daring (online)');
      return;
    }
    if (item.statusKonfirmasi !== 'Terkonfirmasi') {
      alert('Chat dapat diakses setelah jadwal dikonfirmasi');
      return;
    }

    const username = item.nisnSiswa;
    const sessionId = sessionIdFromKonselingId(item.id);

    localStorage.setItem('currentChatSession', sessionId);
    localStorage.setItem('currentChatKonselingId', String(item.id));
    localStorage.setItem('chatSiswaName', item.namaSiswa || username);
    localStorage.setItem('chatSiswaNISN', item.nisnSiswa || '-');
    localStorage.setItem('chatKategori', item.kategori || '-');

    navigate(
      `/chat-guru?session=${encodeURIComponent(sessionId)}&konseling=${item.id}&siswa=${encodeURIComponent(item.namaSiswa || username)}&kategori=${encodeURIComponent(item.kategori || '-')}`
    );
  }

  async function handleWalkinSave(payload) {
    const res = await simpanWalkinKonseling({
      nis: payload.nis,
      guru_bk: currentGuru.nama,
      tanggal: payload.tanggal,
      jam: payload.jam,
      jenis: payload.jenis,
      kategori: payload.kategori,
      deskripsi: payload.deskripsi,
      catatan: payload.catatan,
    });

    if (!res.success) {
      const hint = res.error?.includes('terdaftar')
        ? ''
        : '\n\nPastikan NIS sudah punya akun siswa (walk-in memakai akun yang sudah ada, belum bisa membuat akun baru).';
      alert(`❌ ${res.error}${hint}`);
      return;
    }

    await loadSemuaKonseling(currentGuru);
    setShowWalkinModal(false);

    if (payload.langsungLaporan) {
      alert('✅ Data konseling walk-in berhasil disimpan!\n\nSelanjutnya silakan lengkapi laporan hasil konseling.');
      setLaporanItemId(res.data.id);
    } else {
      alert(
        '✅ Data konseling walk-in berhasil disimpan!\n\nData sudah berstatus Terkonfirmasi dan muncul di tab "Sudah Dikonfirmasi". Silakan buat laporan hasil konseling setelah sesi selesai.'
      );
    }
  }

  function handleCetak() {
    if (konselingByFilter.length === 0) {
      alert('Tidak ada data untuk dicetak!');
      return;
    }
    localStorage.setItem('laporanKonseling', JSON.stringify(konselingByFilter));
    localStorage.setItem('laporanFilter', currentFilter);
    localStorage.setItem('guruName', currentGuru.nama);
    localStorage.setItem('sekolahName', 'SMA Negeri Darussholah Singojuruh');
    localStorage.setItem('sekolahAlamat', 'Jl. Aruji Karta Winata, No. 39 Gumirih Kec. Singojuruh - Banyuwangi');
    localStorage.setItem('sekolahTelp', 'Telp. 0333 - 635381');
    localStorage.setItem('kepalaSekolah', 'WAHYU WINDARI, M.Pd.');
    localStorage.setItem('kepalaSekolahNip', 'NIP. 19730317 199903 2 007');
    window.open('/cetak-laporan', '_blank');
  }

  // ==================== SISWA HANDLERS ====================
  const loadDaftarSiswa = useCallback(async () => {
    setIsLoadingSiswa(true);
    setSiswaLoadError(false);
    try {
      const data = await fetchAllSiswa();
      setSemuaSiswa(data);
      setSiswaLoaded(true);
    } catch {
      setSiswaLoadError(true);
    } finally {
      setIsLoadingSiswa(false);
    }
  }, []);

  const filteredSiswa = useMemo(() => {
    const term = siswaSearch.trim().toLowerCase();
    return semuaSiswa.filter((s) => {
      const matchSearch = !term || s.nis.toLowerCase().includes(term) || s.nama.toLowerCase().includes(term);
      const matchKelas = !siswaFilterKelas || s.kelas === siswaFilterKelas;
      const matchJK = !siswaFilterJK || s.jenis_kelamin === siswaFilterJK;
      return matchSearch && matchKelas && matchJK;
    });
  }, [semuaSiswa, siswaSearch, siswaFilterKelas, siswaFilterJK]);

  function handleKelasAktifBerubah(nis, kelasBaru) {
    setSemuaSiswa((prev) => prev.map((s) => (s.nis === nis ? { ...s, kelas: kelasBaru } : s)));
  }

  // ==================== INFORMASI HANDLERS ====================
  const loadDaftarInformasi = useCallback(async () => {
    setIsLoadingInformasi(true);
    setInformasiLoadError(false);
    try {
      const data = await fetchAllInformasi();
      setSemuaInformasi(data);
      setInformasiLoaded(true);
    } catch {
      setInformasiLoadError(true);
    } finally {
      setIsLoadingInformasi(false);
    }
  }, []);

  const filteredInformasi = useMemo(() => {
    const term = informasiSearch.trim().toLowerCase();
    return semuaInformasi.filter((info) => {
      const matchSearch =
        !term || info.judul.toLowerCase().includes(term) || info.isi.toLowerCase().includes(term);
      const matchKategori = !informasiFilterKategori || info.kategori === informasiFilterKategori;
      return matchSearch && matchKategori;
    });
  }, [semuaInformasi, informasiSearch, informasiFilterKategori]);

  async function handleSaveInformasi(payload) {
    const res = await simpanInformasi({ ...payload, guruBk: currentGuru.nama });
    if (res.success) {
      setShowInformasiModal(false);
      setEditingInformasi(null);
      await loadDaftarInformasi();
    } else {
      alert(`❌ ${res.error}`);
    }
  }

  async function handleHapusInformasi(id) {
    if (!confirm('Hapus informasi ini? Chatbot tidak akan lagi bisa menjawab berdasarkan info ini.')) return;
    const res = await hapusInformasi(id);
    if (res.success) {
      await loadDaftarInformasi();
    } else {
      alert(`❌ ${res.error}`);
    }
  }

  // ==================== TAB SWITCH ====================
  function switchTab(tab) {
    setActiveTab(tab);
    if (tab === 'siswa' && !siswaLoaded) loadDaftarSiswa();
    if (tab === 'informasi' && !informasiLoaded) loadDaftarInformasi();
  }

  function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout dari dashboard Guru BK?')) {
      auth.logout('guru');
      navigate('/login-guru');
    }
  }

  async function handleFotoChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !currentGuru?.username) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran foto maksimal 2MB');
      return;
    }
    const res = await uploadFotoGuruBk(currentGuru.username, file);
    if (res.success) {
      const updated = { ...currentGuru, foto_profile: res.foto_profile };
      auth.loginAsGuru(updated);
      alert(res.message || 'Foto profil berhasil diubah');
    } else {
      alert(res.error || 'Gagal mengunggah foto');
    }
  }

  async function handleHapusFoto() {
    if (!currentGuru?.username) return;
    if (!confirm('Hapus foto profil?')) return;
    const res = await deleteFotoGuruBk(currentGuru.username);
    if (res.success) {
      const updated = { ...currentGuru, foto_profile: null };
      auth.loginAsGuru(updated);
      alert(res.message || 'Foto profil dihapus');
    } else {
      alert(res.error || 'Gagal menghapus foto');
    }
  }

  if (!currentGuru) return null;

  const tabTitles = {
    konseling: { title: '📋 Monitoring & Konfirmasi Konseling', desc: `Kelola, konfirmasi jadwal, dan pantau semua permintaan konseling dari siswa untuk ${currentGuru?.nama || 'Guru BK'}` },
    siswa: { title: '👥 Daftar Siswa', desc: '' },
    informasi: { title: '💡 Informasi & FAQ Chatbot', desc: '' },
  };

  return (
    <div className="guru-bk-page">
      {guruNotifToast && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 3000,
            maxWidth: 360,
            background: '#1a1a18',
            color: '#fff',
            borderRadius: 12,
            padding: '14px 16px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
            cursor: 'pointer',
          }}
          onClick={() => setGuruNotifToast(null)}
          role="status"
        >
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{guruNotifToast.judul}</div>
          <div style={{ fontSize: 12.5, opacity: 0.9, lineHeight: 1.4 }}>{guruNotifToast.pesan}</div>
        </div>
      )}

      <div className="header">
        <div className="logo-section">
          <div className="logo">📚</div>
          <div className="header-info">
            <h1>Dashboard Guru BK</h1>
            <p>Stop Bullying - Monitoring &amp; Konfirmasi Konseling Siswa</p>
          </div>
        </div>
        <div className="user-info" style={{ position: 'relative' }}>
          {/* Lonceng notifikasi — selalu tampil */}
          <div style={{ position: 'relative', marginRight: 10 }}>
            <button
              type="button"
              onClick={() => setGuruNotifOpen((o) => !o)}
              title="Notifikasi"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                borderRadius: 20,
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>🔔</span>
              {guruNotifUnread > 0 ? (
                <span
                  style={{
                    background: '#E24B4A',
                    color: '#fff',
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    fontSize: 11,
                    lineHeight: '18px',
                    textAlign: 'center',
                    padding: '0 5px',
                  }}
                >
                  {guruNotifUnread}
                </span>
              ) : (
                <span style={{ opacity: 0.85, fontSize: 11 }}>Notif</span>
              )}
            </button>

            {guruNotifOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 320,
                  maxHeight: 360,
                  overflowY: 'auto',
                  background: '#fff',
                  color: '#1a1a18',
                  borderRadius: 12,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                  zIndex: 2500,
                  border: '1px solid #e8e6dc',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderBottom: '1px solid #eee',
                    position: 'sticky',
                    top: 0,
                    background: '#fff',
                  }}
                >
                  <strong style={{ fontSize: 13 }}>Notifikasi</strong>
                  {guruNotifUnread > 0 && (
                    <button
                      type="button"
                      onClick={handleClearGuruNotif}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#534AB7',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>
                {guruNotifList.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#888', fontSize: 13 }}>
                    Belum ada notifikasi.
                  </div>
                ) : (
                  guruNotifList.map((n) => (
                    <div
                      key={n.id || `${n.createdAt}-${n.judul}`}
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid #f0eee6',
                        background: n.isRead ? '#fff' : '#F5F3FF',
                      }}
                    >
                      <div style={{ fontWeight: 650, fontSize: 12.5, marginBottom: 4 }}>{n.judul}</div>
                      <div style={{ fontSize: 12, color: '#5F5E5A', lineHeight: 1.4 }}>{n.pesan}</div>
                      {n.createdAt && (
                        <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                          {new Date(n.createdAt).toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <label className="user-avatar user-avatar-editable" title="Klik untuk ganti foto profil" style={{ cursor: 'pointer', overflow: 'hidden' }}>
            {currentGuru.foto_profile ? (
              <img src={mediaUrl(currentGuru.foto_profile)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              currentGuru.avatar
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFotoChange} />
          </label>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>{currentGuru.nama}</div>
            <div style={{ fontSize: '11.5px', opacity: 0.85 }}>
              Konselor Sekolah
              {currentGuru.foto_profile ? (
                <> · <button type="button" onClick={handleHapusFoto} style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '11.5px', opacity: 0.9 }}>Hapus foto</button></>
              ) : (
                <> · <span style={{ opacity: 0.8 }}>Klik avatar untuk foto</span></>
              )}
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      <div className="container">
        <Sidebar
          activeTab={activeTab}
          currentFilter={currentFilter}
          prosesCount={stats.proses}
          onSelectKonseling={handleSelectFilter}
          onSelectSiswa={() => switchTab('siswa')}
          onSelectInformasi={() => switchTab('informasi')}
        />

        <div className="main-content">
          <div className="content-header">
            <h2>{tabTitles[activeTab].title}</h2>
            {activeTab === 'konseling' ? (
              <p>{tabTitles.konseling.desc}</p>
            ) : null}
          </div>

          <div className="tab-nav">
            <button
              className={`tab-btn ${activeTab === 'konseling' ? 'active' : ''}`}
              onClick={() => switchTab('konseling')}
            >
              📋 Konseling
            </button>
            <button className={`tab-btn ${activeTab === 'siswa' ? 'active' : ''}`} onClick={() => switchTab('siswa')}>
              👥 Daftar Siswa
            </button>
          </div>

          {activeTab === 'konseling' && !isLoadingKonseling && (
            <KonselingTab
              guruNama={currentGuru.nama}
              stats={stats}
              currentFilter={currentFilter}
              filteredData={filteredKonseling}
              tahunAjaranOptions={tahunAjaranOptions}
              searchTerm={searchTerm}
              filterKelas={filterKelas}
              filterTahun={filterTahun}
              onSearchChange={setSearchTerm}
              onFilterKelasChange={setFilterKelas}
              onFilterTahunChange={setFilterTahun}
              onWalkin={() => setShowWalkinModal(true)}
              onCetak={handleCetak}
              onDetail={handleOpenDetail}
              onKonfirmasi={handleOpenDetail}
              onLaporan={handleOpenLaporan}
              onBatal={handleBatal}
              onChat={handleChat}
              onLihatLaporan={handleLihatLaporan}
              onEditLaporan={handleOpenLaporan}
            />
          )}

          {activeTab === 'siswa' && (
            <SiswaTab
              siswaList={filteredSiswa}
              totalCount={semuaSiswa.length}
              searchTerm={siswaSearch}
              filterKelas={siswaFilterKelas}
              filterJK={siswaFilterJK}
              onSearchChange={setSiswaSearch}
              onFilterKelasChange={setSiswaFilterKelas}
              onFilterJKChange={setSiswaFilterJK}
              onTambahSiswa={() => setShowTambahSiswaModal(true)}
              onImportExcel={() => setShowImportSiswaModal(true)}
              onImportAbsen={() => setShowImportAbsenModal(true)}
              onEditKelas={(s) => setRiwayatKelasSiswa(s)}
              isLoading={isLoadingSiswa}
              loadError={siswaLoadError}
            />
          )}

          {activeTab === 'informasi' && (
            <InformasiTab
              informasiList={filteredInformasi}
              totalCount={semuaInformasi.length}
              searchTerm={informasiSearch}
              filterKategori={informasiFilterKategori}
              onSearchChange={setInformasiSearch}
              onFilterKategoriChange={setInformasiFilterKategori}
              onTambah={() => {
                setEditingInformasi(null);
                setShowInformasiModal(true);
              }}
              onEdit={(info) => {
                setEditingInformasi(info);
                setShowInformasiModal(true);
              }}
              onHapus={handleHapusInformasi}
              isLoading={isLoadingInformasi}
              loadError={informasiLoadError}
            />
          )}
        </div>
      </div>

      <DetailModal
        item={detailItem}
        onClose={() => setDetailItemId(null)}
        onKonfirmasi={handleKonfirmasi}
        onBatal={handleBatal}
        onLaporan={handleOpenLaporan}
        onEditLaporan={handleOpenLaporan}
      />
      <LaporanModal item={laporanItem} onClose={() => setLaporanItemId(null)} onSave={handleSaveLaporan} />
      <LaporanDetailModal item={laporanDetailItem} onClose={() => setLaporanDetailItemId(null)} />
      <WalkinModal show={showWalkinModal} onClose={() => setShowWalkinModal(false)} onSave={handleWalkinSave} />

      <TambahSiswaModal
        show={showTambahSiswaModal}
        onClose={() => setShowTambahSiswaModal(false)}
        onSave={async (payload) => {
          const res = await tambahSiswaManual(payload);
          if (res.success) {
            alert(`✅ ${res.data.message}`);
            setShowTambahSiswaModal(false);
            await loadDaftarSiswa();
          } else {
            alert(`❌ ${res.error}`);
          }
        }}
      />
      <ImportSiswaModal
        show={showImportSiswaModal}
        onClose={() => setShowImportSiswaModal(false)}
        onImported={loadDaftarSiswa}
      />
      <ImportAbsenModal
        show={showImportAbsenModal}
        onClose={() => setShowImportAbsenModal(false)}
        onImported={loadDaftarSiswa}
      />
      {riwayatKelasSiswa && (
        <RiwayatKelasModal
          siswa={riwayatKelasSiswa}
          onClose={() => setRiwayatKelasSiswa(null)}
          onKelasAktifBerubah={handleKelasAktifBerubah}
        />
      )}

      <InformasiModal
        show={showInformasiModal}
        editing={editingInformasi}
        onClose={() => {
          setShowInformasiModal(false);
          setEditingInformasi(null);
        }}
        onSave={handleSaveInformasi}
      />
    </div>
  );
}
