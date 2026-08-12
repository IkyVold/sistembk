import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import './history.css';

function StatusBadge({ status }) {
  const cls = status === 'Selesai' ? 'badge-selesai' : status === 'Proses' ? 'badge-proses' : 'badge-dibatalkan';
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {status || 'Proses'}
    </span>
  );
}

export default function History() {
  const navigate = useNavigate();
  const { siswa, logout } = useAuth();
  const [history, setHistory] = useState(null); // null = loading
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!siswa?.nis) return;
    axiosClient
      .get(`/api/konseling/${siswa.nis}`)
      .then(({ data }) => setHistory(data))
      .catch((err) => {
        console.error('Gagal memuat riwayat konseling:', err);
        setLoadError(true);
      });
  }, [siswa?.nis]);

  function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      logout('siswa');
      navigate('/login');
    }
  }

  const total = history?.length || 0;
  const selesai = history?.filter((i) => i.status === 'Selesai').length || 0;
  const proses = history?.filter((i) => i.status === 'Proses').length || 0;

  return (
    <div className="history-page">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">🛡️</div>
            <h2>StopBully</h2>
          </div>
          <p>Student Portal</p>
        </div>
        <div className="sidebar-divider" />
        <p className="sidebar-section-label">Menu</p>
        <ul className="sidebar-menu">
          <li>
            <Link to="/profile">
              <span className="menu-icon">👤</span>
              <span>Profile</span>
            </Link>
          </li>
          <li>
            <Link to="/history" className="active">
              <span className="menu-icon">📋</span>
              <span>History</span>
            </Link>
          </li>
          <li>
            <a onClick={handleLogout} style={{ cursor: 'pointer' }}>
              <span className="menu-icon">🚪</span>
              <span>Logout</span>
            </a>
          </li>
        </ul>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="breadcrumb">
              <Link to="/">Home</Link>
              <span>/</span>History
            </div>
            <h1>Riwayat Konseling</h1>
            <p className="page-subtitle">
              Status konseling akan diperbarui oleh Guru BK setelah konseling selesai dilaksanakan.
            </p>
          </div>
        </div>

        {history && history.length > 0 && (
          <div className="summary-strip">
            <div className="summary-chip">
              <div className="summary-chip-dot" style={{ background: 'var(--accent)' }} />
              <div>
                <div className="summary-chip-count" style={{ color: 'var(--accent)' }}>{total}</div>
                <div className="summary-chip-label">Total Sesi</div>
              </div>
            </div>
            <div className="summary-chip">
              <div className="summary-chip-dot" style={{ background: 'var(--success)' }} />
              <div>
                <div className="summary-chip-count" style={{ color: 'var(--success)' }}>{selesai}</div>
                <div className="summary-chip-label">Selesai</div>
              </div>
            </div>
            <div className="summary-chip">
              <div className="summary-chip-dot" style={{ background: 'var(--warning)' }} />
              <div>
                <div className="summary-chip-count" style={{ color: 'var(--warning)' }}>{proses}</div>
                <div className="summary-chip-label">Dalam Proses</div>
              </div>
            </div>
          </div>
        )}

        <div>
          {loadError && (
            <div className="empty-state">
              <div className="empty-icon">⚠️</div>
              <div className="empty-title">Gagal Memuat Riwayat</div>
              <div className="empty-sub">Tidak dapat terhubung ke server. Coba muat ulang halaman.</div>
            </div>
          )}

          {!loadError && history && history.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">Belum Ada Riwayat Konseling</div>
              <div className="empty-sub">Mulai konseling pertama Anda untuk melihat riwayat di sini</div>
            </div>
          )}

          {!loadError && history && history.length > 0 && (
            <div className="history-grid">
              {history.map((item) => {
                const hasLaporan = Boolean(item.laporan_kesimpulan || item.laporan);
                const showKonfirmasiBadge = item.status === 'Proses';
                const isTerkonfirmasi = (item.status_konfirmasi === 'Terkonfirmasi' || item.status_konfirmasi === 'Tervalidasi');
                const warningNote = item.status === 'Selesai' && !hasLaporan;

                return (
                  <div className="history-card" key={item.id} onClick={() => navigate(`/history/${item.id}`)}>
                    <div className="history-card-header">
                      <div className="history-category">
                        <div className="category-icon">📚</div>
                        Konseling {item.kategori || '—'}
                        {item.pengajuan_sebelumnya_id ? (
                          <span
                            title={`Lanjutan dari sesi #${item.pengajuan_sebelumnya_id}`}
                            style={{
                              marginLeft: 8,
                              fontSize: 11,
                              background: '#dbeafe',
                              color: '#1e40af',
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontWeight: 600,
                            }}
                          >
                            🔗 Lanjutan #{item.pengajuan_sebelumnya_id}
                          </span>
                        ) : null}
                      </div>
                      <div className="history-date-chip">📅 {item.tanggal || '—'}</div>
                    </div>
                    <div className="history-card-body">
                      <div className="info-line">
                        <div className="info-line-icon">👨‍🏫</div>
                        <div className="info-line-key">Guru BK</div>
                        <div className="info-line-val">{item.guru || '—'}</div>
                      </div>
                      <div className="info-line">
                        <div className="info-line-icon">📖</div>
                        <div className="info-line-key">Jenis</div>
                        <div className="info-line-val">{item.jenis || '—'}</div>
                      </div>
                      <div className="info-line">
                        <div className="info-line-icon">🕐</div>
                        <div className="info-line-key">Jam</div>
                        <div className="info-line-val">{item.jam || '—'}</div>
                      </div>
                    </div>
                    {warningNote && <div className="warning-note">⚠️ Belum ada laporan hasil konseling</div>}
                    <div className="history-card-footer">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <StatusBadge status={item.status} />
                        {showKonfirmasiBadge &&
                          (isTerkonfirmasi ? (
                            <span className="badge badge-terkonfirmasi">
                              <span className="badge-dot" />
                              Jadwal Terkonfirmasi
                            </span>
                          ) : (
                            <span className="badge badge-belumkonfirmasi">
                              <span className="badge-dot" />
                              Belum Dikonfirmasi
                            </span>
                          ))}
                        {hasLaporan ? (
                          <span className="badge badge-laporan">
                            <span className="badge-dot" />
                            Ada Laporan
                          </span>
                        ) : (
                          <span className="badge badge-nolap">
                            <span className="badge-dot" />
                            Belum Ada Laporan
                          </span>
                        )}
                      </div>
                      <span className="card-arrow">→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bottom-action">
          <Link to="/" className="btn">🏠 Kembali ke Beranda</Link>
        </div>
      </main>
    </div>
  );
}
