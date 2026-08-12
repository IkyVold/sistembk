import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import axiosClient, { extractErrorMessage } from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import './jadwal.css';

const JAM_LIST = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00',
];

export default function Jadwal() {
  const navigate = useNavigate();
  const { siswa } = useAuth();

  const [guruNama, setGuruNama] = useState('');
  const [jenisKonseling, setJenisKonseling] = useState('Luring');
  const [tanggal, setTanggal] = useState('');
  const [jam, setJam] = useState('');
  const [kategori, setKategori] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const nama = localStorage.getItem('guruNama');
    if (nama) setGuruNama(nama);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const deskripsiLen = deskripsi.trim().length;
  let charHintText = 'Minimal 20 karakter';
  let charHintColor = '#b4b2a9';
  if (deskripsiLen > 0 && deskripsiLen < 20) {
    charHintText = `${20 - deskripsiLen} karakter lagi`;
    charHintColor = '#A32D2D';
  } else if (deskripsiLen >= 20) {
    charHintText = `${deskripsiLen} karakter`;
    charHintColor = '#0F6E56';
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!jenisKonseling) { alert('Pilih jenis konseling!'); return; }
    if (!tanggal) { alert('Pilih tanggal konseling!'); return; }
    if (!jam) { alert('Pilih jam konseling!'); return; }
    if (!kategori) { alert('Pilih kategori masalah!'); return; }
    const desk = deskripsi.trim();
    if (!desk) { alert('Deskripsi masalah harus diisi!'); return; }
    if (desk.length < 20) {
      alert('Deskripsi terlalu pendek. Minimal 20 karakter agar Guru BK dapat memahami masalah Anda.');
      return;
    }

    if (!guruNama) {
      alert('Guru BK belum dipilih. Silakan pilih Guru BK terlebih dahulu.');
      navigate('/pilih');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await axiosClient.post('/api/konseling', {
        nis: siswa?.nis,
        guru_bk: guruNama,
        guru_username: localStorage.getItem('guruUsername') || undefined,
        tanggal,
        jam,
        jenis: jenisKonseling,
        kategori,
        deskripsi: desk,
      });

      localStorage.setItem('lastKonselingId', data.id);

      if (jenisKonseling === 'Daring') {
        alert(
          '✅ Pengajuan konseling daring berhasil!\n\nSetelah jadwal dikonfirmasi oleh Guru BK, Anda dapat mengakses fitur chat online di halaman Status.'
        );
      } else {
        alert('✅ Pengajuan konseling luring berhasil!\n\nSilakan cek halaman Status untuk informasi jadwal yang telah dikonfirmasi.');
      }

      navigate(`/status?id=${data.id}`);
    } catch (err) {
      alert(`❌ Gagal menyimpan pengajuan: ${extractErrorMessage(err)}\n\nPastikan server backend sedang berjalan.`);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="jadwal-page">
      <Navbar />

      <div className="page-wrap">
        <div className="breadcrumb">
          <Link to="/">Beranda</Link>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          <Link to="/pilih">Konseling</Link>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          <span>Penjadwalan</span>
        </div>

        <div className="page-title">Ajukan Penjadwalan Konseling</div>
        <div className="page-sub">
          Isi formulir berikut dengan lengkap agar Guru BK dapat mempersiapkan sesi konseling terbaik untuk Anda.
        </div>

        <div className="guru-card">
          <div className="guru-avatar">{guruNama ? guruNama.charAt(0).toUpperCase() : 'G'}</div>
          <div>
            <div className="guru-label">Guru BK yang dipilih</div>
            <div className="guru-name">{guruNama || '–'}</div>
          </div>
        </div>

        <div className="notice notice-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
          </svg>
          Isi deskripsi masalah dengan jelas dan detail agar Guru BK dapat memahami situasi Anda dengan lebih baik.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-card" style={{ marginTop: '16px' }}>
            <div className="form-section-title">Waktu &amp; Jenis Konseling</div>
            <div className="form-body">
              <div className="field">
                <label htmlFor="jenis-konseling">Jenis konseling</label>
                <select
                  id="jenis-konseling"
                  value={jenisKonseling}
                  onChange={(e) => setJenisKonseling(e.target.value)}
                  required
                >
                  <option value="Luring">Luring (Tatap Muka)</option>
                  <option value="Daring">Daring (Online)</option>
                </select>
              </div>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="tanggal">Tanggal</label>
                  <input
                    type="date"
                    id="tanggal"
                    min={today}
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="jam">Jam</label>
                  <select id="jam" value={jam} onChange={(e) => setJam(e.target.value)} required>
                    <option value="">Pilih jam</option>
                    {JAM_LIST.map((j) => (
                      <option value={j} key={j}>{j}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="form-card" style={{ marginTop: '12px' }}>
            <div className="form-section-title">Detail Masalah</div>
            <div className="form-body">
              <div className="field">
                <label htmlFor="kategori">Kategori masalah</label>
                <select id="kategori" value={kategori} onChange={(e) => setKategori(e.target.value)} required>
                  <option value="">Pilih kategori</option>
                  <option value="Akademik">Akademik</option>
                  <option value="Sosial">Sosial</option>
                  <option value="Pribadi">Pribadi</option>
                  <option value="Karir">Karir</option>
                  <option value="Bullying">Bullying</option>
                  <option value="Keluarga">Keluarga</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="deskripsi">Deskripsi masalah</label>
                <textarea
                  id="deskripsi"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder={
                    'Jelaskan masalah atau topik yang ingin dikonsultasikan dengan detail...\n\nContoh:\n- Apa yang terjadi?\n- Kapan kejadiannya?\n- Siapa saja yang terlibat?\n- Bagaimana perasaan Anda?'
                  }
                  required
                />
                <div className="char-hint" style={{ color: charHintColor }}>{charHintText}</div>
              </div>
            </div>
          </div>

          {jenisKonseling === 'Daring' && (
            <div className="notice notice-chat" style={{ marginTop: '12px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Konseling daring dipilih. Setelah jadwal dikonfirmasi oleh Guru BK, Anda dapat mengakses fitur chat
              real-time di halaman Status.
            </div>
          )}

          <div className="notice notice-warning" style={{ marginTop: '12px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Jadwal konseling dapat berubah sesuai konfirmasi dari Guru BK. Periksa status secara berkala di halaman
            Status.
          </div>

          <div className="form-actions" style={{ marginTop: '24px' }}>
            <Link to="/pilih" className="btn-cancel">Kembali</Link>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
