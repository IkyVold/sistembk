import { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar';
import ChatWidget from './ChatWidget';
import AiChatbot from './AiChatbot';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import './beranda.css';

export default function Beranda() {
  const { siswa } = useAuth();
  const [semuaKonseling, setSemuaKonseling] = useState([]);
  const aiChatbotRef = useRef(null);

  const nama = siswa?.nama || siswa?.nis || 'Siswa';

  useEffect(() => {
    if (!siswa?.nis) return;
    let cancelled = false;

    axiosClient
      .get(`/api/konseling/${siswa.nis}`)
      .then(({ data }) => {
        if (!cancelled) setSemuaKonseling(data);
      })
      .catch((e) => {
        console.error('Gagal memuat riwayat konseling untuk daftar chat:', e);
      });

    return () => {
      cancelled = true;
    };
  }, [siswa?.nis]);

  return (
    <div className="beranda-page">
      <Navbar />

      <div className="hero">
        <div className="hero-left">
          <h1>
            Halo, <span>{nama}</span>.<br />
            Anda tidak sendirian.
          </h1>
          <p>
            Sistem konseling aman dan terpercaya untuk melaporkan, berdiskusi, dan mendapatkan bantuan dari guru
            BK profesional.
          </p>
          <div className="hero-actions">
            <a href="/pilih" className="cta-button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Ajukan konseling
            </a>
            <button className="faq-button" onClick={() => aiChatbotRef.current?.open()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Ada pertanyaan cepat? Tanya FAQ
            </button>
          </div>
        </div>
        <div className="hero-right">
          <div className="stat-card">
            <div className="stat-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div className="stat-label">Guru BK siap membantu</div>
              <div className="stat-value">3 konselor tersedia</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <div className="stat-label">Privasi terjaga</div>
              <div className="stat-value">Data Anda aman &amp; rahasia</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon coral">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <div className="stat-label">Mode konseling</div>
              <div className="stat-value">Tatap muka &amp; daring</div>
            </div>
          </div>
        </div>
      </div>

      <ChatWidget semuaKonseling={semuaKonseling} currentUserId={siswa?.nis} />
      <AiChatbot ref={aiChatbotRef} />
    </div>
  );
}
