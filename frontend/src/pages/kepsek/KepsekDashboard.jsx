import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './components/Sidebar';
import DashboardTab from './DashboardTab';
import RekapGuruTab from './RekapGuruTab';
import SemuaKonselingTab from './SemuaKonselingTab';
import StatistikTab from './StatistikTab';
import DetailModal from './modals/DetailModal';
import { fetchKonselingAll } from './api';
import { mapKonselingRow } from './helpers';
import './kepsekDashboard.css';

export default function KepsekDashboard() {
  const navigate = useNavigate();
  const auth = useAuth();
  const kepsek = auth.kepsek;

  const [semuaKonseling, setSemuaKonseling] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [detailItemId, setDetailItemId] = useState(null);

  useEffect(() => {
    if (!kepsek) {
      navigate('/login-kepsek');
      return;
    }

    fetchKonselingAll()
      .then((rows) => {
        const mapped = rows.map(mapKonselingRow);
        mapped.sort((a, b) => new Date(b.tanggal || '2000-01-01') - new Date(a.tanggal || '2000-01-01'));
        setSemuaKonseling(mapped);
      })
      .catch((e) => {
        console.error('Gagal memuat data konseling dari server:', e);
        alert('⚠️ Gagal memuat data konseling dari server. Pastikan backend berjalan.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kepsek]);

  const detailItem = useMemo(
    () => semuaKonseling.find((item) => item.id === detailItemId) || null,
    [semuaKonseling, detailItemId]
  );

  function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      auth.logout('kepsek');
      navigate('/login-kepsek');
    }
  }

  function notImplemented() {
    alert('Fungsi export akan diimplementasikan');
  }

  if (!kepsek) return null;

  return (
    <div className="kepsek-page">
      <div className="header">
        <div className="logo-section">
          <div className="logo">🏫</div>
          <div className="header-info">
            <h1>Dashboard Kepala Sekolah</h1>
            <p>Monitoring &amp; Evaluasi Layanan BK - Stop Bullying</p>
          </div>
        </div>
        <div className="user-info">
          <div className="user-avatar">
            {kepsek.nama
              ?.split(' ')
              .map((w) => w.charAt(0))
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'KS'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px' }}>{kepsek.nama}</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>{kepsek.sekolah}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      <div className="container">
        <Sidebar activeTab={activeTab} onSelect={setActiveTab} />

        <div className="main-content">
          {activeTab === 'dashboard' && (
            <DashboardTab
              semuaKonseling={semuaKonseling}
              kepsekNama={kepsek.nama}
              kepsekSekolah={kepsek.sekolah}
              onDetail={setDetailItemId}
              onExportExcel={notImplemented}
            />
          )}
          {activeTab === 'rekap-guru' && (
            <RekapGuruTab semuaKonseling={semuaKonseling} onExportExcel={notImplemented} />
          )}
          {activeTab === 'semua-konseling' && (
            <SemuaKonselingTab semuaKonseling={semuaKonseling} onDetail={setDetailItemId} onExportExcel={notImplemented} />
          )}
          {activeTab === 'statistik' && <StatistikTab semuaKonseling={semuaKonseling} />}
        </div>
      </div>

      <DetailModal item={detailItem} onClose={() => setDetailItemId(null)} />
    </div>
  );
}
