import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import ChatRoom from './ChatRoom';

export default function ChatGuru() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { guru } = useAuth();
  const [setup, setSetup] = useState(null);
  const [siswaFoto, setSiswaFoto] = useState(null);

  useEffect(() => {
    const sessionFromUrl = searchParams.get('session');
    const siswaFromUrl = searchParams.get('siswa');
    const kategoriFromUrl = searchParams.get('kategori');

    const currentGuru = {
      id: guru?.username || localStorage.getItem('guruBKUsername'),
      name: guru?.username || localStorage.getItem('guruBKUsername') || 'Guru BK',
      type: 'guru',
    };

    const siswaName = (siswaFromUrl || localStorage.getItem('chatSiswaName') || 'Siswa').slice(0, 100);
    const siswaNis = localStorage.getItem('chatSiswaNISN');
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

    // Ambil foto profil siswa (kalau ada) untuk ditampilkan di header chat
    if (siswaNis && siswaNis !== '-') {
      axiosClient
        .get(`/api/profile/${siswaNis}`)
        .then(({ data }) => setSiswaFoto(data?.foto_profile || null))
        .catch(() => setSiswaFoto(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!setup) return null;

  const infoBannerDefault = setup.kategori
    ? `📋 Kategori: ${setup.kategori} • 💬 Chat dengan ${setup.siswaName}`
    : `💬 Chat dengan ${setup.siswaName}`;

  return (
    <ChatRoom
      sessionId={setup.sessionId}
      currentUser={setup.currentUser}
      headerTitle={`Konseling dengan ${setup.siswaName}`}
      headerSubtitle={setup.siswaName}
      avatarUrl={siswaFoto}
      avatarName={setup.siswaName}
      backHref="/guru-bk"
      backLabel="Dashboard"
      infoBannerDefault={infoBannerDefault}
    />
  );
}
