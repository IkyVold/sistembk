import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ChatRoom from './ChatRoom';

export default function ChatGuru() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { guru } = useAuth();
  const [setup, setSetup] = useState(null);

  useEffect(() => {
    const sessionFromUrl = searchParams.get('session');
    const siswaFromUrl = searchParams.get('siswa');
    const kategoriFromUrl = searchParams.get('kategori');

    const currentGuru = {
      id: guru?.username || localStorage.getItem('guruBKUsername'),
      name: guru?.username || localStorage.getItem('guruBKUsername') || 'Guru BK',
      type: 'guru',
    };

    const siswaName = siswaFromUrl || localStorage.getItem('chatSiswaName') || 'Siswa';
    const sessionId = sessionFromUrl || localStorage.getItem('currentChatSession');

    if (!sessionId) {
      alert('Session ID tidak ditemukan!');
      navigate('/guru-bk');
      return;
    }

    setSetup({
      sessionId,
      currentUser: currentGuru,
      siswaName,
      kategori: kategoriFromUrl,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!setup) return null;

  const infoBannerDefaultHtml = setup.kategori
    ? `📋 Kategori: ${setup.kategori} • 💬 Chat dengan ${setup.siswaName}`
    : '🔒 Percakapan bersifat rahasia — hanya kamu dan siswa yang bisa melihatnya';

  return (
    <ChatRoom
      sessionId={setup.sessionId}
      currentUser={setup.currentUser}
      headerTitle={`Konseling dengan ${setup.siswaName}`}
      headerSubtitleHtml={`<strong>${setup.siswaName}</strong>`}
      avatarEmoji="🧑‍🏫"
      backHref="/guru-bk"
      backLabel="Dashboard"
      infoBannerDefaultHtml={infoBannerDefaultHtml}
    />
  );
}
