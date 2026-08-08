import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ChatRoom from './ChatRoom';

export default function ChatSiswa() {
  const navigate = useNavigate();
  const { siswa } = useAuth();
  const [setup, setSetup] = useState(null); // { sessionId, currentUser, guruName } | 'invalid'

  useEffect(() => {
    const jenisKonseling = localStorage.getItem('jenisKonseling');
    if (jenisKonseling !== 'Daring') {
      alert('Chat hanya tersedia untuk konseling daring (online)');
      navigate('/status');
      return;
    }

    const guruNama = localStorage.getItem('chatGuruName') || localStorage.getItem('guruNama');
    if (!guruNama) {
      alert('Data konseling tidak lengkap. Silakan pilih guru BK terlebih dahulu.');
      navigate('/pilih');
      return;
    }

    const currentUser = {
      id: siswa?.nis || localStorage.getItem('currentUser'),
      name: siswa?.nama || localStorage.getItem('currentUserNama') || localStorage.getItem('currentUser'),
      type: 'siswa',
    };

    const today = new Date().toISOString().split('T')[0];
    const sessionId = `session_${currentUser.id}_${guruNama.replace(/\s/g, '_')}_${today}`;

    setSetup({ sessionId, currentUser, guruName: guruNama });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!setup) return null;

  return (
    <ChatRoom
      sessionId={setup.sessionId}
      currentUser={setup.currentUser}
      headerTitle={`Konseling dengan ${setup.guruName}`}
      headerSubtitleHtml={`<strong>${setup.guruName}</strong>`}
      avatarEmoji="👤"
      backHref="/"
      backLabel="Kembali"
      infoBannerDefaultHtml="🔒 Percakapan bersifat rahasia — hanya kamu dan Guru BK yang bisa melihatnya"
    />
  );
}
