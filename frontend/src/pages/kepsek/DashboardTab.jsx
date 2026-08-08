import PieChart from './components/PieChart';
import StatusBarChart from './components/StatusBarChart';
import KategoriBarChart from './components/KategoriBarChart';
import KategoriTable from './components/KategoriTable';
import GuruCards from './components/GuruCards';
import { hitungStatistik } from './helpers';

export default function DashboardTab({ semuaKonseling, kepsekNama, kepsekSekolah, onDetail, onExportExcel }) {
  const stats = hitungStatistik(semuaKonseling);
  const recent = semuaKonseling.slice(0, 5);
  const periode = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="content-header">
        <h2>📊 Dashboard Monitoring</h2>
        <p>Selamat datang, {kepsekNama}. Berikut ringkasan layanan konseling di {kepsekSekolah}</p>
      </div>

      <div className="summary-box">
        <div className="summary-title">
          <span>📅</span> Periode: {periode}
        </div>
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-label">Total Konseling</div>
            <div className="summary-value">{stats.total}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Siswa Aktif</div>
            <div className="summary-value">{stats.siswaAktif}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Guru BK Aktif</div>
            <div className="summary-value">{stats.guruAktif}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Konseling Selesai</div>
            <div className="summary-value">{stats.selesai}</div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>Total Konseling</h3>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card stat-akademik">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>Akademik</h3>
            <div className="stat-value">{stats.akademik}</div>
          </div>
        </div>
        <div className="stat-card stat-sosial">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Sosial</h3>
            <div className="stat-value">{stats.sosial}</div>
          </div>
        </div>
        <div className="stat-card stat-pribadi">
          <div className="stat-icon">💭</div>
          <div className="stat-info">
            <h3>Pribadi</h3>
            <div className="stat-value">{stats.pribadi}</div>
          </div>
        </div>
        <div className="stat-card stat-bullying">
          <div className="stat-icon">🛡️</div>
          <div className="stat-info">
            <h3>Bullying</h3>
            <div className="stat-value">{stats.bullying}</div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">
            <span>📊</span> Distribusi Kategori Konseling
          </div>
          <div className="chart-container">
            <PieChart stats={stats} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">
            <span>📈</span> Status Konseling
          </div>
          <div className="chart-container">
            <StatusBarChart stats={stats} />
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="chart-card">
          <div className="chart-title">
            <span>📊</span> Diagram Batang — Jumlah Kasus per Kategori
          </div>
          <div className="chart-container">
            <KategoriBarChart stats={stats} />
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>📊 Rekap Jumlah &amp; Persentase per Kategori Masalah</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Kategori</th>
              <th>Jumlah Kasus</th>
              <th>Persentase</th>
            </tr>
          </thead>
          <tbody>
            <KategoriTable stats={stats} />
          </tbody>
        </table>
      </div>

      <h3 style={{ margin: '20px 0 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>👨‍🏫</span> Aktivitas Guru BK
      </h3>
      <GuruCards semuaKonseling={semuaKonseling} />

      <div className="table-container">
        <div className="table-header">
          <h3>📋 5 Konseling Terbaru</h3>
          <button className="export-btn btn-excel" onClick={onExportExcel}>
            <span>📥</span> Export Excel
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Siswa</th>
              <th>Guru BK</th>
              <th>Kategori</th>
              <th>Status</th>
              <th>Laporan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                  Belum ada data konseling
                </td>
              </tr>
            ) : (
              recent.map((item) => {
                let statusClass = 'status-proses';
                if (item.status === 'Selesai') statusClass = 'status-selesai';
                else if (item.status === 'Dibatalkan') statusClass = 'status-dibatalkan';
                return (
                  <tr key={item.id}>
                    <td>{item.tanggal || '-'}</td>
                    <td>{item.namaSiswa || item.username}</td>
                    <td><span className="guru-badge">{item.guru}</span></td>
                    <td>{item.kategori || '-'}</td>
                    <td><span className={`status-badge ${statusClass}`}>{item.status}</span></td>
                    <td>
                      {item.laporanGuru ? (
                        <span className="status-badge status-selesai">✅ Ada</span>
                      ) : (
                        <span className="status-badge status-proses">❌ Belum</span>
                      )}
                    </td>
                    <td>
                      <button className="export-btn btn-excel" style={{ padding: '5px 10px' }} onClick={() => onDetail(item.id)}>
                        <span>🔍</span> Detail
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
