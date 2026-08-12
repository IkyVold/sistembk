import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ChatRoom from './ChatRoom';
import { sessionIdFromKonselingId, parseKonselingIdFromSession } from '../../utils/chatSession';

export default function ChatSiswa() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

    // Session harus berbasis konseling_id
    const konselingId =
      searchParams.get('konseling') ||
      localStorage.getItem('currentChatKonselingId') ||
      localStorage.getItem('lastKonselingId');

    let sessionId =
      searchParams.get('session') ||
      localStorage.getItem('currentChatSession');

    if (konselingId) {
      try {
        sessionId = sessionIdFromKonselingId(konselingId);
        localStorage.setItem('currentChatSession', sessionId);
        localStorage.setItem('currentChatKonselingId', String(konselingId));
      } catch {
        sessionId = null;
      }
    }

    // Tolak format lama session_NIS_guru_tanggal
    if (!sessionId || !parseKonselingIdFromSession(sessionId)) {
      alert('Sesi chat tidak valid. Buka chat dari detail konseling yang sudah dikonfirmasi.');
      navigate('/history');
      return;
    }

    setSetup({ sessionId, currentUser, guruName: guruNama });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!setup) return null;

  return (
    <ChatRoom
      sessionId={setup.sessionId}
      currentUser={setup.currentUser}
      headerTitle={`Konseling dengan ${setup.guruName}`}
      headerSubtitle={setup.guruName}
      avatarName={setup.guruName}
      backHref="/"
      backLabel="Kembali"
      infoBannerDefault="🔒 Percakapan bersifat rahasia — hanya kamu dan Guru BK yang bisa melihatnya"
    />
  );
}
