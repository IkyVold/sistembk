import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { COUNSELOR_LIST } from '../data/counselorList';
import '../styles/pilihGuru.css';

export default function PilihGuru() {
  const navigate = useNavigate();

  function handlePilih(counselor) {
    localStorage.setItem('guruNama', counselor.nama);
    localStorage.setItem('guruSpesialisasi', counselor.spesialisasi);
    localStorage.setItem('guruNpsn', counselor.npsn);
    localStorage.setItem('guruAlamat', counselor.alamat);
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

      <div className="cards-wrapper">
        {COUNSELOR_LIST.map((counselor) => (
          <div className="counselor-card" key={counselor.nama}>
            <img src={counselor.avatar} alt={counselor.nama} className="counselor-avatar" />
            <div className="counselor-info">
              <div className="counselor-name">{counselor.nama}</div>
              <div className="counselor-meta">
                <span className="role-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  {counselor.spesialisasi}
                </span>
                <span className="meta-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  NPSN {counselor.npsn}
                </span>
                <span className="meta-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {counselor.alamat}
                </span>
              </div>
            </div>
            <button className="pilih-button" onClick={() => handlePilih(counselor)}>
              Pilih
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
