import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { sessionIdFromKonselingId } from '../../utils/chatSession';
import Navbar from '../../components/Navbar';
import axiosClient, { extractErrorMessage } from '../../api/axiosClient';
import './detailHistory.css';

const SYSTEM_PROMPT = {
  role: 'system',
  content:
    'Kamu adalah asisten konseling AI yang ramah, empatis, dan profesional untuk siswa sekolah. Kamu membantu siswa dengan masalah akademik, sosial, dan pribadi. Berikan respons dalam Bahasa Indonesia yang hangat dan supportif.',
};

function DetailChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, isTyping]);

  function toggle() {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && messages.length === 0) {
        setMessages([
          { role: 'assistant', content: 'Halo! Saya asisten konseling AI. Ada yang ingin Anda diskusikan seputar konseling atau masalah yang sedang Anda hadapi?' },
        ]);
      }
      return next;
    });
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    const nextHistory = [...messages, { role: 'user', content: text }];
    setMessages(nextHistory);
    setIsTyping(true);
    try {
      const { data } = await axiosClient.post('/api/chat', { messages: [SYSTEM_PROMPT, ...nextHistory] });
      setIsTyping(false);
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error('Format respons tidak valid dari server');
      }
    } catch (err) {
      setIsTyping(false);
      const message = err.response?.data?.error?.message || err.message || 'Terjadi kesalahan';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Maaf, terjadi kesalahan: ${message}\n\nSilakan coba lagi nanti.` }]);
    }
  }

  return (
    <>
      <button className={`chatbot-button ${isOpen ? 'active' : ''}`} onClick={toggle}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      <div className={`chat-modal ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><circle cx="15" cy="10" r="1.5" /><path d="M9 14s1 1 3 1 3-1 3-1" />
              </svg>
            </div>
            <div>
              <div className="chat-title">Asisten Konseling AI</div>
              <div className="chat-subtitle">Powered by Backend Server</div>
            </div>
          </div>
          <button onClick={toggle} className="chat-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div className={`chat-msg ${msg.role === 'user' ? 'user' : 'bot'}`} key={i}>
              {msg.role !== 'user' && (
                <div className="msg-avatar-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><circle cx="15" cy="10" r="1.5" />
                  </svg>
                </div>
              )}
              <div className="msg-bubble">
                {msg.content.split('\n').map((line, j, arr) => (
                  <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                ))}
              </div>
              {msg.role === 'user' && (
                <div className="msg-avatar-user">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="chat-msg bot typing-indicator">
              <div className="msg-avatar-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="14" rx="2" /></svg>
              </div>
              <div className="msg-bubble"><span></span><span></span><span></span></div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input-field"
            placeholder="Ketik pesan Anda..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} className="chat-send-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div className="chat-footer-note">Asisten AI — percakapan bersifat rahasia</div>
      </div>
    </>
  );
}

export default function DetailHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [connConnected, setConnConnected] = useState(false);
  const [showBatalModal, setShowBatalModal] = useState(false);
  const [alasanBatal, setAlasanBatal] = useState('');
  const [batalLoading, setBatalLoading] = useState(false);

  useEffect(() => {
    axiosClient
      .get('/api/test')
      .then(() => setConnConnected(true))
      .catch(() => setConnConnected(false));
    const interval = setInterval(() => {
      axiosClient
        .get('/api/test')
        .then(() => setConnConnected(true))
        .catch(() => setConnConnected(false));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!id) {
      alert('Data tidak ditemukan!');
      navigate('/history');
      return;
    }
    axiosClient
      .get(`/api/konseling/detail/${id}`)
      .then(({ data }) => setItem(data))
      .catch(() => {
        alert('Data tidak ditemukan!');
        navigate('/history');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleStartChat() {
    if (!item) {
      alert('Data konseling tidak ditemukan!');
      return;
    }
    const guruNama = item.guru;
    const currentUser = localStorage.getItem('currentUser');
    const sessionId = sessionIdFromKonselingId(item.id || id);
    localStorage.setItem('chatGuruName', guruNama);
    localStorage.setItem('currentChatSession', sessionId);
    localStorage.setItem('currentChatKonselingId', String(item.id || id));
    localStorage.setItem('jenisKonseling', 'Daring');
    navigate('/chat-siswa');
  }

  async function handleBatalkan() {
    const alasan = alasanBatal.trim();
    if (alasan.length < 10) {
      alert('Alasan pembatalan minimal 10 karakter.');
      return;
    }
    if (!confirm('Apakah Anda yakin ingin membatalkan pengajuan konseling ini?')) return;

    setBatalLoading(true);
    try {
      const { data } = await axiosClient.put(`/api/konseling/${id}/batal-siswa`, { alasan });
      if (!data.success) throw new Error(data.error || 'Gagal membatalkan');
      alert('✅ Pengajuan konseling berhasil dibatalkan.');
      setShowBatalModal(false);
      setAlasanBatal('');
      // Refresh data agar status & alasan tampil
      const refreshed = await axiosClient.get(`/api/konseling/detail/${id}`);
      setItem(refreshed.data);
    } catch (err) {
      alert(`❌ ${extractErrorMessage(err, 'Gagal membatalkan pengajuan')}`);
    } finally {
      setBatalLoading(false);
    }
  }

  if (!item) {
    return (
      <div className="detail-history-page">
        <Navbar />
        <div className="page-wrap">
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888780' }}>Memuat data…</div>
        </div>
      </div>
    );
  }

  const guruNama = item.guru || '–';
  const status = item.status || 'Proses';
  const statusKonfirmasi = (item.status_konfirmasi === 'Tervalidasi' ? 'Terkonfirmasi' : (item.status_konfirmasi || 'Belum Dikonfirmasi'));
  const isTerkonfirmasi = statusKonfirmasi === 'Terkonfirmasi';

  let statusBadgeClass = 'badge-proses';
  if (status === 'Selesai') statusBadgeClass = 'badge-selesai';
  else if (status === 'Dibatalkan') statusBadgeClass = 'badge-dibatalkan';

  const laporan = {
    tanggalLaporan: item.laporan_tanggal,
    waktuLaporan: item.laporan_waktu,
    dibuatOleh: item.laporan_dibuat_oleh,
    kesimpulan: item.laporan_kesimpulan,
    rekomendasi: item.laporan_rekomendasi,
    statusPenanganan: item.laporan_status_penanganan,
    catatanTambahan: item.laporan_catatan_tambahan,
  };
  const hasLaporan = Boolean(laporan.kesimpulan || laporan.rekomendasi || laporan.statusPenanganan);

  let laporanStatusClass = 'badge-terkonfirmasi';
  if (laporan.statusPenanganan?.includes('Selesai')) laporanStatusClass = 'badge-selesai';
  else if (laporan.statusPenanganan?.includes('Monitoring')) laporanStatusClass = 'badge-proses';

  const showChatBtn = item.jenis === 'Daring' && isTerkonfirmasi && status !== 'Dibatalkan';
  const canBatalkan = status === 'Proses';

  return (
    <div className="detail-history-page">
      <Navbar />

      <div className="connection-status">
        <span className={`status-dot ${connConnected ? 'connected' : ''}`} />
        <span>{connConnected ? 'Terhubung ke server' : 'Menghubungkan...'}</span>
      </div>

      <div className="page-wrap">
        <div className="breadcrumb">
          <Link to="/">Beranda</Link>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          <Link to="/history">Riwayat</Link>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          <span>Detail Konseling</span>
        </div>

        <div className="header-card">
          <div className="header-card-left">
            <div className="guru-avatar">{guruNama.charAt(0).toUpperCase()}</div>
            <div>
              <div className="header-guru-name">{guruNama}</div>
              <div className="header-guru-sub">Guru Bimbingan Konseling</div>
            </div>
          </div>
          <span className={`badge ${statusBadgeClass}`}>
            <span className="badge-dot" />
            {status}
          </span>
        </div>

        {(item.sesi_sebelumnya || (item.sesi_lanjutan && item.sesi_lanjutan.length > 0) || item.pengajuan_sebelumnya_id) && (
          <div className="info-card" style={{ borderColor: '#bfdbfe', background: '#f8fbff' }}>
            <div className="card-section-title">🔗 Rantai Sesi Konseling</div>
            {item.sesi_sebelumnya && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Sesi sebelumnya</div>
                <button
                  type="button"
                  onClick={() => navigate(`/history/${item.sesi_sebelumnya.id}`)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 12px',
                    borderRadius: 8, border: '1px solid #bfdbfe', background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <strong>#{item.sesi_sebelumnya.id}</strong>
                  {' · '}{item.sesi_sebelumnya.tanggal || '–'} {item.sesi_sebelumnya.jam || ''}
                  {' · '}{item.sesi_sebelumnya.kategori || '–'}
                  {' · '}<em>{item.sesi_sebelumnya.status}</em>
                </button>
              </div>
            )}
            {!item.sesi_sebelumnya && item.pengajuan_sebelumnya_id && (
              <div style={{ marginBottom: 12, fontSize: 13 }}>
                Lanjutan dari sesi{' '}
                <button
                  type="button"
                  onClick={() => navigate(`/history/${item.pengajuan_sebelumnya_id}`)}
                  style={{ color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  #{item.pengajuan_sebelumnya_id}
                </button>
              </div>
            )}
            {item.sesi_lanjutan && item.sesi_lanjutan.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Sesi lanjutan</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {item.sesi_lanjutan.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => navigate(`/history/${child.id}`)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 12px',
                        borderRadius: 8, border: '1px solid #bfdbfe', background: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <strong>#{child.id}</strong>
                      {' · '}{child.tanggal || '–'} {child.jam || ''}
                      {' · '}{child.kategori || '–'}
                      {' · '}<em>{child.status}</em>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="info-card">
          <div className="card-section-title">Informasi Jadwal</div>
          <div className="info-grid">
            <div className="info-cell">
              <div className="info-cell-label">Spesialisasi</div>
              <div className="info-cell-value">BK</div>
            </div>
            <div className="info-cell">
              <div className="info-cell-label">NPSN</div>
              <div className="info-cell-value">{localStorage.getItem('guruNpsn') || '–'}</div>
            </div>
            <div className="info-cell">
              <div className="info-cell-label">Tanggal</div>
              <div className="info-cell-value">{item.tanggal || '–'}</div>
            </div>
            <div className="info-cell">
              <div className="info-cell-label">Jam</div>
              <div className="info-cell-value">{item.jam || '–'}</div>
            </div>
            <div className="info-cell">
              <div className="info-cell-label">Jenis Konseling</div>
              <div className="info-cell-value">{item.jenis || '–'}</div>
            </div>
            <div className="info-cell">
              <div className="info-cell-label">Kategori</div>
              <div className="info-cell-value">{item.kategori || '–'}</div>
            </div>
            <div className="info-cell">
              <div className="info-cell-label">Status Konfirmasi</div>
              <div className="info-cell-value">
                <span className={`badge ${isTerkonfirmasi ? 'badge-terkonfirmasi' : 'badge-belum'}`}>
                  <span className="badge-dot" />
                  {statusKonfirmasi}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="card-section-title">Deskripsi Masalah</div>
          <div className="deskripsi-body">
            <div className="deskripsi-text">{item.deskripsi || 'Tidak ada deskripsi'}</div>
          </div>
        </div>

        {hasLaporan && (
          <div className="laporan-card">
            <div className="laporan-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
              </svg>
              Laporan Hasil Konseling
            </div>
            <div className="laporan-items">
              <div className="laporan-item">
                <div className="laporan-item-label">Tanggal Laporan</div>
                <div className="laporan-item-value">{laporan.tanggalLaporan || '-'} &bull; {laporan.waktuLaporan || '-'}</div>
              </div>
              <div className="laporan-item">
                <div className="laporan-item-label">Dibuat Oleh</div>
                <div className="laporan-item-value">{laporan.dibuatOleh || item.guru || 'Guru BK'}</div>
              </div>
              <div className="laporan-item">
                <div className="laporan-item-label">Kesimpulan Konseling</div>
                <div className="laporan-item-value">{laporan.kesimpulan || 'Tidak ada kesimpulan'}</div>
              </div>
              <div className="laporan-item">
                <div className="laporan-item-label">Rekomendasi / Tindak Lanjut</div>
                <div className="laporan-item-value">{laporan.rekomendasi || 'Tidak ada rekomendasi'}</div>
              </div>
              <div className="laporan-item">
                <div className="laporan-item-label">Status Penanganan</div>
                <div className="laporan-item-value">
                  <span className={`badge ${laporanStatusClass}`}>
                    <span className="badge-dot" />
                    {laporan.statusPenanganan || 'Selesai'}
                  </span>
                </div>
              </div>
              {laporan.catatanTambahan && laporan.catatanTambahan !== '-' && (
                <div className="laporan-item">
                  <div className="laporan-item-label">Catatan Tambahan</div>
                  <div className="laporan-item-value">{laporan.catatanTambahan}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {status === 'Dibatalkan' && item.alasan_batal && (
          <div className="desc-card" style={{ borderColor: '#F0B8B8', background: '#FDF6F6' }}>
            <div className="desc-label" style={{ color: '#A32D2D' }}>Alasan Pembatalan</div>
            <p className="desc-text">{item.alasan_batal}</p>
          </div>
        )}

        <div className="action-row">
          <Link to="/history" className="btn btn-outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Kembali ke Riwayat
          </Link>
          {canBatalkan && (
            <button
              className="btn btn-batal"
              type="button"
              onClick={() => setShowBatalModal(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
              </svg>
              Batalkan Pengajuan
            </button>
          )}
          {showChatBtn && (
            <button className="btn btn-primary" onClick={handleStartChat}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Mulai Chat Online
            </button>
          )}
        </div>
      </div>

      {showBatalModal && (
        <div className="batal-modal-overlay" onClick={() => !batalLoading && setShowBatalModal(false)}>
          <div className="batal-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="batal-modal-title">Batalkan Pengajuan Konseling</h3>
            <p className="batal-modal-desc">
              Pengajuan akan ditandai sebagai <strong>Dibatalkan</strong>. Mohon isi alasan pembatalan.
            </p>
            <label className="batal-modal-label" htmlFor="alasan-batal">
              Alasan pembatalan <span>(min. 10 karakter)</span>
            </label>
            <textarea
              id="alasan-batal"
              className="batal-modal-textarea"
              rows={4}
              value={alasanBatal}
              onChange={(e) => setAlasanBatal(e.target.value)}
              placeholder="Contoh: Jadwal bentrok dengan kegiatan sekolah / ada kesalahan pada deskripsi masalah..."
              disabled={batalLoading}
            />
            <div className="batal-modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowBatalModal(false)}
                disabled={batalLoading}
              >
                Tutup
              </button>
              <button
                type="button"
                className="btn btn-batal"
                onClick={handleBatalkan}
                disabled={batalLoading || alasanBatal.trim().length < 10}
              >
                {batalLoading ? 'Memproses…' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DetailChatbot />
    </div>
  );
}
