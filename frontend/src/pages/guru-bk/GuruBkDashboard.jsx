import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { activateRoleToken, getTokenForRole } from '../../api/tokenStore';
import { uploadFotoGuruBk, deleteFotoGuruBk } from '../../api/akunService';
import { mediaUrl } from '../../utils/mediaUrl';
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
import {
  fetchKonselingByGuru,
  validasiJadwalKonseling,
  ubahStatusKonseling,
  simpanLaporanKonseling,
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

  // Pastikan token JWT role guru aktif (hindari 403 karena token siswa masih aktif)
  useEffect(() => {
    const t = activateRoleToken('guru');
    if (!t && auth.guru) {
      // Session UI ada tapi token guru tidak ada → wajib login ulang
      console.warn('Token guru tidak ditemukan — silakan login ulang');
      auth.logout('guru');
      navigate('/login-guru');
    }
  }, [auth.guru, navigate]);

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

  // Notifikasi di judul tab browser
  const prosesCount = useMemo(
    () => semuaKonseling.filter((item) => item.status === 'Proses' && item.statusValidasi !== 'Tervalidasi').length,
    [semuaKonseling]
  );
  useEffect(() => {
    document.title = prosesCount > 0 ? `(${prosesCount}) Dashboard Guru BK - Stop Bullying` : 'Dashboard Guru BK - Stop Bullying';
  }, [prosesCount]);

  const stats = useMemo(() => {
    const total = semuaKonseling.length;
    const proses = prosesCount;
    const tervalidasi = semuaKonseling.filter(
      (item) => item.statusValidasi === 'Tervalidasi' && item.status !== 'Selesai' && item.status !== 'Dibatalkan'
    ).length;
    const selesai = semuaKonseling.filter((item) => item.status === 'Selesai').length;
    const dibatalkan = semuaKonseling.filter((item) => item.status === 'Dibatalkan').length;
    return { total, proses, tervalidasi, selesai, dibatalkan };
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
        return semuaKonseling.filter((item) => item.status === 'Proses' && item.statusValidasi !== 'Tervalidasi');
      case 'tervalidasi':
        return semuaKonseling.filter(
          (item) => item.statusValidasi === 'Tervalidasi' && item.status !== 'Selesai' && item.status !== 'Dibatalkan'
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

  async function handleValidasi(item, { tanggal, jam }) {
    if (!tanggal || !jam) {
      alert('❌ Silakan pilih tanggal dan jam validasi terlebih dahulu!');
      return;
    }

    let konfirmasi = true;
    if (item.tanggalRaw !== tanggal || item.jam !== jam) {
      konfirmasi = confirm(
        `⚠️ PERUBAHAN JADWAL KONSELING\n\n` +
          `Jadwal Diajukan Siswa:\n📅 Tanggal: ${item.tanggal}\n⏰ Jam: ${item.jam}\n\n` +
          `Jadwal Validasi Guru BK:\n📅 Tanggal: ${formatTanggal(tanggal)}\n⏰ Jam: ${jam}\n\n` +
          `Siswa akan melihat jadwal yang sudah divalidasi ini.\nApakah Anda yakin ingin memvalidasi jadwal ini?`
      );
    }
    if (!konfirmasi) return;

    const res = await validasiJadwalKonseling(item.id, { tanggal, jam });
    if (res.success) {
      await loadSemuaKonseling(currentGuru);
      setDetailItemId(null);
      alert(
        '✅ Jadwal berhasil divalidasi!\n\nSiswa sekarang dapat melihat jadwal yang sudah dikonfirmasi.\n\nSetelah sesi konseling selesai, jangan lupa untuk membuat laporan hasil konseling.'
      );
    } else {
      alert(`❌ Gagal memvalidasi jadwal: ${res.error}`);
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
    const res = await simpanLaporanKonseling(id, { ...payload, dibuatOleh: currentGuru.nama });
    if (res.success) {
      await loadSemuaKonseling(currentGuru);
      setLaporanItemId(null);
      const edited = res.data.edited;
      alert(`✅ ${res.data.message}${edited ? '' : '\n\nStatus konseling telah diubah menjadi Selesai.'}`);
    } else {
      alert(`❌ Terjadi kesalahan saat menyimpan laporan: ${res.error}`);
    }
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
    if (item.statusValidasi !== 'Tervalidasi') {
      alert('Chat dapat diakses setelah jadwal divalidasi');
      return;
    }

    const username = item.nisnSiswa;
    const guruNama = item.guru;
    const today = new Date().toISOString().split('T')[0];
    const sessionId = `session_${username}_${guruNama.replace(/\s/g, '_')}_${today}`;

    localStorage.setItem('currentChatSession', sessionId);
    localStorage.setItem('chatSiswaName', item.namaSiswa || username);
    localStorage.setItem('chatSiswaNISN', item.nisnSiswa || '-');
    localStorage.setItem('chatKategori', item.kategori || '-');

    navigate(
      `/chat-guru?session=${encodeURIComponent(sessionId)}&siswa=${encodeURIComponent(item.namaSiswa || username)}&kategori=${encodeURIComponent(item.kategori || '-')}`
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
        '✅ Data konseling walk-in berhasil disimpan!\n\nData sudah berstatus Tervalidasi dan muncul di tab "Sudah Divalidasi". Silakan buat laporan hasil konseling setelah sesi selesai.'
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
    konseling: { title: '📋 Monitoring & Validasi Konseling', desc: `Kelola, validasi jadwal, dan pantau semua permintaan konseling dari siswa untuk <strong>${currentGuru.nama}</strong>` },
    siswa: { title: '👥 Daftar Siswa', desc: '' },
    informasi: { title: '💡 Informasi & FAQ Chatbot', desc: '' },
  };

  return (
    <div className="guru-bk-page">
      <div className="header">
        <div className="logo-section">
          <div className="logo">📚</div>
          <div className="header-info">
            <h1>Dashboard Guru BK</h1>
            <p>Stop Bullying - Monitoring &amp; Validasi Konseling Siswa</p>
          </div>
        </div>
        <div className="user-info">
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
              <p dangerouslySetInnerHTML={{ __html: tabTitles.konseling.desc }} />
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
              onValidasi={handleOpenDetail}
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
        onValidasi={handleValidasi}
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
