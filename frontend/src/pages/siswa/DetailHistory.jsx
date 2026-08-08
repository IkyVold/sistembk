import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import axiosClient from '../../api/axiosClient';
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
    const today = new Date().toISOString().split('T')[0];
    const sessionId = `session_${currentUser}_${guruNama.replace(/\s/g, '_')}_${today}`;
    localStorage.setItem('chatGuruName', guruNama);
    localStorage.setItem('currentChatSession', sessionId);
    localStorage.setItem('jenisKonseling', 'Daring');
    navigate('/chat-siswa');
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
  const statusValidasi = item.status_validasi || 'Belum Divalidasi';
  const isTervalidasi = statusValidasi === 'Tervalidasi';

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

  let laporanStatusClass = 'badge-tervalidasi';
  if (laporan.statusPenanganan?.includes('Selesai')) laporanStatusClass = 'badge-selesai';
  else if (laporan.statusPenanganan?.includes('Monitoring')) laporanStatusClass = 'badge-proses';

  const showWhatsapp = item.jenis === 'Daring';
  const showChatBtn = item.jenis === 'Daring' && isTervalidasi;

  let waLink = '#';
  if (showWhatsapp) {
    const phoneNumber = '6281230649618';
    const message = encodeURIComponent(
      `Halo ${item.guru}, saya ingin melakukan konseling daring pada ${item.tanggal} jam ${item.jam}. Kategori: ${item.kategori}`
    );
    waLink = `https://wa.me/${phoneNumber}?text=${message}`;
  }

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
              <div className="info-cell-label">Status Validasi</div>
              <div className="info-cell-value">
                <span className={`badge ${isTervalidasi ? 'badge-tervalidasi' : 'badge-belum'}`}>
                  <span className="badge-dot" />
                  {statusValidasi}
                </span>
              </div>
            </div>
            {showWhatsapp && (
              <div className="info-cell">
                <div className="info-cell-label">Link Konseling</div>
                <div className="info-cell-value">
                  <a href={waLink} target="_blank" rel="noreferrer" className="wa-link">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    Hubungi via WhatsApp
                  </a>
                </div>
              </div>
            )}
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

        <div className="action-row">
          <Link to="/history" className="btn btn-outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Kembali ke Riwayat
          </Link>
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

      <DetailChatbot />
    </div>
  );
}
