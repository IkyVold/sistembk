import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { fetchGuruBkPublic } from '../api/akunService';
import { mediaUrl } from '../utils/mediaUrl';
import '../styles/pilihGuru.css';

const FALLBACK_AVATARS = [
  'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=47',
  'https://i.pravatar.cc/150?img=33',
  'https://i.pravatar.cc/150?img=20',
  'https://i.pravatar.cc/150?img=5',
];

export default function PilihGuru() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetchGuruBkPublic();
      if (cancelled) return;
      if (res.success) {
        setList(res.data);
        setError('');
      } else {
        setError(res.error || 'Gagal memuat daftar Guru BK');
        setList([]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  function handlePilih(counselor) {
    // Nama dipakai field guru_bk; username untuk notifikasi andal ke Guru BK
    localStorage.setItem('guruNama', counselor.nama);
    localStorage.setItem('guruId', counselor.id != null ? String(counselor.id) : '');
    localStorage.setItem('guruUsername', counselor.username || '');
    localStorage.setItem('guruSpesialisasi', counselor.spesialisasi || 'Guru BK');
    localStorage.setItem('guruNpsn', counselor.npsn || '');
    localStorage.setItem('guruAlamat', counselor.alamat || '');
    navigate('/jadwal');
  }

  return (
    <div className="pilih-page">
      <Navbar />

      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">Beranda</Link>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span>Konseling</span>
        </div>
        <h1>Pilih Guru BK</h1>
        <p>
          Pilih guru bimbingan konseling yang ingin Anda hubungi. Laporan akan langsung diteruskan
          ke guru yang dipilih.
        </p>
      </div>

      <div className="info-banner">
        <div className="info-inner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          Semua konsultasi bersifat rahasia. Data Anda hanya dapat diakses oleh guru yang Anda
          pilih.
        </div>
      </div>

      {loading && (
        <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Memuat daftar Guru BK...</p>
      )}
      {error && !loading && (
        <p style={{ textAlign: 'center', padding: '2rem', color: '#c0392b' }}>{error}</p>
      )}
      {!loading && !error && list.length === 0 && (
        <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Belum ada Guru BK yang tersedia. Hubungi Admin.
        </p>
      )}

      <div className="cards-wrapper">
        {list.map((counselor, index) => (
          <div className="counselor-card" key={counselor.id || counselor.nama}>
            {counselor.foto_profile ? (
              <img
                src={mediaUrl(counselor.foto_profile)}
                alt={counselor.nama}
                className="counselor-avatar"
              />
            ) : (
              <div className="counselor-avatar counselor-avatar-initials" aria-hidden>
                {(counselor.avatar || counselor.nama || '?').toString().slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="counselor-info">
              <div className="counselor-name">{counselor.nama}</div>
              <div className="counselor-meta">
                <span className="role-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  {counselor.spesialisasi || 'Guru BK'}
                </span>
                {counselor.npsn && (
                  <span className="meta-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                    NPSN {counselor.npsn}
                  </span>
                )}
                {counselor.alamat && (
                  <span className="meta-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {counselor.alamat}
                  </span>
                )}
              </div>
            </div>
            <button className="pilih-button" onClick={() => handlePilih(counselor)}>
              Pilih Guru
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
