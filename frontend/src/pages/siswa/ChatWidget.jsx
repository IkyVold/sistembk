import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GURU_BK_LIST } from '../../data/guruBkList';

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

// Bangun daftar sesi chat dari riwayat konseling daring yang sudah tervalidasi
// (satu sesi per guru, sama seperti logika asli di index.html)
function buildChatSessions(semuaKonseling, currentUserId) {
  const chatSessions = [];
  const validKonseling = semuaKonseling.filter(
    (item) => item.jenis === 'Daring' && item.status_validasi === 'Tervalidasi' && item.status !== 'Dibatalkan'
  );

  validKonseling.forEach((konseling) => {
    const existing = chatSessions.find((c) => c.guruName === konseling.guru);
    if (!existing) {
      const today = new Date().toISOString().split('T')[0];
      const sessionId = `session_${currentUserId}_${konseling.guru.replace(/\s/g, '_')}_${today}`;
      let lastMessage = konseling.deskripsi?.substring(0, 50) || 'Konseling telah divalidasi';
      let lastTime = konseling.tanggal_validasi || konseling.tanggal;

      const chatKey = `chat_${sessionId}`;
      const chatHistory = localStorage.getItem(chatKey);
      if (chatHistory) {
        try {
          const history = JSON.parse(chatHistory);
          if (history.length > 0) {
            const lastMsg = history[history.length - 1];
            lastMessage = lastMsg.message.substring(0, 50);
            lastTime = lastMsg.timestamp;
          }
        } catch {
          // abaikan history yang corrupt
        }
      }

      chatSessions.push({
        guruName: konseling.guru,
        guruAvatar: konseling.guru.charAt(0),
        lastMessage,
        lastTime,
        unread: 0,
        sessionId,
      });
    }
  });

  chatSessions.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
  return chatSessions;
}

export default function ChatWidget({ semuaKonseling, currentUserId }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const widgetRef = useRef(null);
  const floatBtnRef = useRef(null);

  const chatSessions = buildChatSessions(semuaKonseling, currentUserId);
  const unreadCount = chatSessions.reduce((sum, c) => sum + (c.unread || 0), 0);

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

  function openChat(guruName, sessionId) {
    localStorage.setItem('chatGuruName', guruName);
    localStorage.setItem('currentChatSession', sessionId);
    localStorage.setItem('jenisKonseling', 'Daring');
    setIsOpen(false);
    navigate('/chat-siswa');
  }

  function startNewChat(guruName) {
    localStorage.setItem('guruNama', guruName);
    localStorage.setItem('guruSpesialisasi', 'Guru BK');
    localStorage.setItem('guruNpsn', '023497329432');
    localStorage.setItem('guruAlamat', 'Blitar');
    setIsOpen(false);
    navigate('/jadwal');
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
                <div className="chat-item" key={chat.sessionId} onClick={() => openChat(chat.guruName, chat.sessionId)}>
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
            {GURU_BK_LIST.map((guru) => (
              <div className="contact-item" key={guru.id} onClick={() => startNewChat(guru.nama)}>
                <div className="contact-avatar">{guru.avatar}</div>
                <div className="contact-info">
                  <div className="contact-name">{guru.nama}</div>
                  <div className="contact-role">{guru.spesialisasi}</div>
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
