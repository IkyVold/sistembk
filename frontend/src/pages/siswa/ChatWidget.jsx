import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionIdFromKonselingId } from '../../utils/chatSession';
import { fetchGuruBkPublic } from '../../api/akunService';

function escapeSafe(text) {
  return text || '';
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Kemarin';
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

// Satu room chat per konseling (bukan per guru+hari)
function buildChatSessions(semuaKonseling) {
  const validKonseling = semuaKonseling.filter(
    (item) =>
      item.jenis === 'Daring' &&
      (item.status_konfirmasi === 'Terkonfirmasi' || item.statusKonfirmasi === 'Terkonfirmasi') &&
      item.status !== 'Dibatalkan'
  );

  const chatSessions = validKonseling.map((konseling) => {
    const sessionId = sessionIdFromKonselingId(konseling.id);
    let lastMessage = konseling.deskripsi?.substring(0, 50) || 'Konseling telah dikonfirmasi';
    let lastTime = konseling.tanggal_konfirmasi || konseling.tanggalKonfirmasi || konseling.tanggal;

    return {
      konselingId: konseling.id,
      guruName: konseling.guru,
      guruAvatar: String(konseling.guru || '?').charAt(0),
      lastMessage,
      lastTime,
      unread: 0,
      sessionId,
      kategori: konseling.kategori,
    };
  });

  chatSessions.sort((a, b) => new Date(b.lastTime || 0) - new Date(a.lastTime || 0));
  return chatSessions;
}

export default function ChatWidget({ semuaKonseling, currentUserId }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [guruKontak, setGuruKontak] = useState([]);
  const [loadingKontak, setLoadingKontak] = useState(false);
  const widgetRef = useRef(null);
  const floatBtnRef = useRef(null);

  const chatSessions = buildChatSessions(semuaKonseling || []);
  const unreadCount = chatSessions.reduce((sum, c) => sum + (c.unread || 0), 0);
  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    async function loadGuruKontak() {
      setLoadingKontak(true);
      const res = await fetchGuruBkPublic();
      if (!cancelled && res.success) {
        setGuruKontak(Array.isArray(res.data) ? res.data : []);
      }
      if (!cancelled) setLoadingKontak(false);
    }
    loadGuruKontak();
    return () => { cancelled = true; };
  }, [isOpen]);


  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isOpen &&
        widgetRef.current &&
        !widgetRef.current.contains(event.target) &&
        floatBtnRef.current &&
        !floatBtnRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  function openChat(chat) {
    localStorage.setItem('chatGuruName', chat.guruName);
    localStorage.setItem('guruNama', chat.guruName);
    localStorage.setItem('currentChatSession', chat.sessionId);
    localStorage.setItem('currentChatKonselingId', String(chat.konselingId));
    localStorage.setItem('lastKonselingId', String(chat.konselingId));
    localStorage.setItem('jenisKonseling', 'Daring');
    setIsOpen(false);
    navigate(`/chat-siswa?konseling=${chat.konselingId}&session=${encodeURIComponent(chat.sessionId)}`);
  }

  function startNewChat(guru) {
    // Hanya arahkan ke alur pengajuan — harus pilih jadwal, bukan chat bebas
    const nama = typeof guru === 'string' ? guru : guru?.nama;
    if (!nama) return;
    localStorage.setItem('guruNama', nama);
    if (guru && typeof guru === 'object') {
      if (guru.id != null) localStorage.setItem('guruId', String(guru.id));
      if (guru.username) localStorage.setItem('guruUsername', guru.username);
      localStorage.setItem('guruSpesialisasi', guru.spesialisasi || 'Guru BK');
      localStorage.setItem('guruNpsn', guru.npsn || '');
      localStorage.setItem('guruAlamat', guru.alamat || '');
    }
    setIsOpen(false);
    navigate('/pilih');
  }

  return (
    <>
      <button className="chat-float-btn" ref={floatBtnRef} title="Buka pesan" onClick={() => setIsOpen((v) => !v)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {unreadCount > 0 && <span className="chat-badge-float">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      <div className={`chat-widget ${isOpen ? 'show' : ''}`} ref={widgetRef}>
        <div className="widget-header">
          <div className="widget-header-info">
            <div className="widget-header-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="widget-header-text">
              <h3>Pesan</h3>
              <p>Konseling dengan Guru BK</p>
            </div>
          </div>
          <button className="widget-close" title="Tutup" onClick={() => setIsOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="widget-tabs">
          <button className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')}>
            Chat
          </button>
          <button
            className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            Kontak
          </button>
        </div>

        {activeTab === 'chats' && (
          <div className="chat-list">
            {chatSessions.length === 0 ? (
              <div className="empty-chat">
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="empty-title">Belum ada percakapan</div>
                <div className="empty-desc">Lakukan konseling daring untuk mulai chat dengan guru BK</div>
              </div>
            ) : (
              chatSessions.map((chat) => (
                <div className="chat-item" key={chat.sessionId} onClick={() => openChat(chat)}>
                  <div className="chat-avatar">{(chat.guruAvatar || chat.guruName.charAt(0)).toUpperCase()}</div>
                  <div className="chat-info">
                    <div className="chat-name">
                      {escapeSafe(chat.guruName)}
                      {chat.unread > 0 && <span className="chat-unread-badge">{chat.unread}</span>}
                    </div>
                    <div className="chat-last-message">{escapeSafe(chat.lastMessage || 'Mulai chat sekarang')}</div>
                  </div>
                  <div className="chat-meta">
                    <div className="chat-time">{formatTime(chat.lastTime)}</div>
                    <div className="online-indicator">
                      <div className="dot green" />
                      <span className="online-text">online</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="contacts-list">
            {loadingKontak && (
              <div className="empty-chat" style={{ padding: 16 }}>Memuat daftar Guru BK…</div>
            )}
            {!loadingKontak && guruKontak.length === 0 && (
              <div className="empty-chat" style={{ padding: 16 }}>
                <div className="empty-title">Tidak ada Guru BK aktif</div>
                <div className="empty-desc">Hubungi admin sekolah jika daftar kosong.</div>
              </div>
            )}
            {!loadingKontak &&
              guruKontak.map((guru) => (
                <div
                  className="contact-item"
                  key={guru.id || guru.username}
                  onClick={() => startNewChat(guru)}
                >
                  <div className="contact-avatar">
                    {(guru.avatar || (guru.nama || '?').charAt(0)).toString().slice(0, 2).toUpperCase()}
                  </div>
                  <div className="contact-info">
                    <div className="contact-name">{guru.nama}</div>
                    <div className="contact-role">{guru.spesialisasi || 'Guru BK'}</div>
                  </div>
                </div>
              ))}
          </div>
        )}

        <div className="widget-footer">
          <a href="/pilih" className="new-chat-link" onClick={(e) => { e.preventDefault(); setIsOpen(false); navigate('/pilih'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Mulai konseling baru
          </a>
        </div>
      </div>
    </>
  );
}
