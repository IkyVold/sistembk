import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import axiosClient, { extractErrorMessage } from '../../api/axiosClient';
import StatusChatbot from './StatusChatbot';
import './status.css';

function formatTanggal(t) {
  if (!t || t === '-') return '-';
  try {
    return new Date(t).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return t;
  }
}

export default function Status() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [connStatus, setConnStatus] = useState('connecting'); // connecting | connected | error
  const [item, setItem] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const idRef = useRef(searchParams.get('id') || localStorage.getItem('lastKonselingId'));

  useEffect(() => {
    checkBackendConnection();
    const interval = setInterval(checkBackendConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const id = idRef.current;
    if (!id) {
      alert('Data konseling tidak ditemukan. Silakan ajukan konseling terlebih dahulu.');
      navigate('/pilih');
      return;
    }

    axiosClient
      .get(`/api/konseling/detail/${id}`)
      .then(({ data }) => setItem(data))
      .catch(() => {
        setLoadFailed(true);
        alert('Gagal memuat data konseling dari server. Pastikan backend berjalan.');
        navigate('/history');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkBackendConnection() {
    setConnStatus('connecting');
    try {
      const res = await axiosClient.get('/api/test');
      if (res.status >= 200 && res.status < 300) {
        setConnStatus('connected');
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      setConnStatus('error');
    }
  }

  function handleStartChat() {
    const currentUser = localStorage.getItem('currentUser');
    const guruNama = item ? item.guru : localStorage.getItem('guruNama');
    const tanggal = item ? item.tanggal : null;
    const jam = item ? item.jam : null;
    if (!currentUser || !guruNama) {
      alert('Data konseling tidak lengkap!');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const sessionId = `session_${currentUser}_${guruNama.replace(/\s/g, '_')}_${today}`;
    localStorage.setItem('currentChatSession', sessionId);
    localStorage.setItem('chatGuruName', guruNama);
    localStorage.setItem('chatTanggal', tanggal);
    localStorage.setItem('chatJam', jam);
    navigate('/chat-siswa');
  }

  function handleKonfirmasi() {
    navigate('/history');
  }

  async function handleKonsulUlang() {
    if (!confirm('Apakah Anda yakin ingin membatalkan pengajuan ini dan mengajukan ulang?')) return;
    try {
      await axiosClient.delete(`/api/konseling/${idRef.current}`);
    } catch (err) {
      alert(`❌ Gagal membatalkan pengajuan: ${extractErrorMessage(err)}`);
      return;
    }
    localStorage.removeItem('lastKonselingId');
    ['guruNama', 'guruSpesialisasi', 'guruNpsn', 'guruAlamat'].forEach((k) => localStorage.removeItem(k));
    navigate('/pilih');
  }

  if (loadFailed) return null;
  if (!item) {
    return (
      <div className="status-page">
        <Navbar />
        <div className="page">
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary, #6B6862)' }}>
            Memuat data konseling…
          </div>
        </div>
      </div>
    );
  }

  const namaGuru = item.guru || '-';
  const spesialisasi = localStorage.getItem('guruSpesialisasi') || '-';
  const npsn = localStorage.getItem('guruNpsn') || '-';
  const tanggal = item.tanggal || '-';
  const jam = item.jam || '-';
  const jenisKonseling = item.jenis || '-';
  const kategori = item.kategori || '-';
  const deskripsi = item.deskripsi || 'Tidak ada deskripsi';
  const status = item.status || 'Proses';
  const statusValidasi = item.status_validasi || 'Belum Divalidasi';

  let statusBadgeClass = 'badge badge-process';
  let statusBadgeLabel = 'Proses';
  if (status === 'Selesai') {
    statusBadgeClass = 'badge badge-validated';
    statusBadgeLabel = 'Selesai';
  } else if (status === 'Dibatalkan') {
    statusBadgeClass = 'badge badge-pending';
    statusBadgeLabel = 'Dibatalkan';
  }

  const isTervalidasi = statusValidasi === 'Tervalidasi';
  const showChatBtn = isTervalidasi && jenisKonseling === 'Daring';

  return (
    <div className="status-page">
      <Navbar />

      <div className="page">
        <div className="page-header">
          <div className="page-badge"><span className="dot" /> Live Tracking</div>
          <h1 className="page-title">Status Konseling</h1>
          <p className="page-subtitle">Jadwal kemungkinan berubah terkait validasi guru BK</p>
          <div>
            <span className="conn-pill">
              <span className={`conn-indicator ${connStatus === 'connecting' ? 'connecting' : connStatus === 'connected' ? 'connected' : ''}`} />
              <span>
                {connStatus === 'connecting' && 'Menghubungkan ke server…'}
                {connStatus === 'connected' && 'Terhubung ke server'}
                {connStatus === 'error' && 'Server tidak tersedia'}
              </span>
            </span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-header-label">Informasi Guru &amp; Jadwal</span>
            <span className={statusBadgeClass}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="3" /></svg>
              {statusBadgeLabel}
            </span>
          </div>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Nama Guru</span>
              <span className="info-value">{namaGuru}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Spesialis Bidang</span>
              <span className="info-value">{spesialisasi}</span>
            </div>
            <div className="info-row">
              <span className="info-label">NPSN</span>
              <span className="info-value">{npsn}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Tanggal</span>
              <span className="info-value">{formatTanggal(tanggal)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Jam</span>
              <span className="info-value">{jam}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Jenis Konseling</span>
              <span className="info-value">
                {jenisKonseling === 'Daring' ? <span className="badge badge-daring">Daring</span> : jenisKonseling}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Kategori</span>
              <span className="info-value">{kategori}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status Validasi</span>
              <span className="info-value">
                {isTervalidasi ? (
                  <span className="badge badge-validated">✓ Tervalidasi</span>
                ) : (
                  <span className="badge badge-pending">Belum Divalidasi</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="desc-card">
          <div className="desc-label">Deskripsi Masalah</div>
          <p className="desc-text">{deskripsi}</p>
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={handleKonfirmasi}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            Selesai
          </button>
          <button className="btn btn-secondary" onClick={handleKonsulUlang}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" /></svg>
            Konsul Ulang
          </button>
          {showChatBtn && (
            <button className="btn btn-chat-online" onClick={handleStartChat}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              Mulai Chat Online
            </button>
          )}
        </div>
      </div>

      <StatusChatbot onConnectionError={() => setConnStatus('error')} />
    </div>
  );
}
