import { GURU_BK_LIST } from './constants';
import { hitungStatistik, pct } from './helpers';

export default function StatistikTab({ semuaKonseling }) {
  const stats = hitungStatistik(semuaKonseling);
  const laporanTersedia = semuaKonseling.filter((item) => item.laporanGuru).length;
  const persenLaporan = stats.total > 0 ? ((laporanTersedia / stats.total) * 100).toFixed(1) : 0;
  const periode = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="content-header">
        <h2>📈 Statistik Lengkap</h2>
        <p>Analisis data konseling periode {periode}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Total Konseling</h3>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card stat-total">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Siswa Aktif</h3>
            <div className="stat-value">{stats.siswaAktif}</div>
          </div>
        </div>
        <div className="stat-card stat-total">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-info">
            <h3>Guru BK Aktif</h3>
            <div className="stat-value">{stats.guruAktif}</div>
          </div>
        </div>
        <div className="stat-card stat-total">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>Laporan Tersedia</h3>
            <div className="stat-value">
              {laporanTersedia} <span style={{ fontSize: '14px' }}>({persenLaporan}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">📊 Distribusi Kategori</div>
          <div className="chart-container">
            <table style={{ width: '100%' }}>
              <tbody>
                <tr><td>Akademik</td><td>{stats.akademik}</td><td>{pct(stats.akademik, stats.total)}%</td></tr>
                <tr><td>Sosial</td><td>{stats.sosial}</td><td>{pct(stats.sosial, stats.total)}%</td></tr>
                <tr><td>Pribadi</td><td>{stats.pribadi}</td><td>{pct(stats.pribadi, stats.total)}%</td></tr>
                <tr><td>Karir</td><td>{stats.karir}</td><td>{pct(stats.karir, stats.total)}%</td></tr>
                <tr><td>Bullying</td><td>{stats.bullying}</td><td>{pct(stats.bullying, stats.total)}%</td></tr>
                <tr><td>Keluarga</td><td>{stats.keluarga}</td><td>{pct(stats.keluarga, stats.total)}%</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">📈 Status Konseling</div>
          <div className="chart-container">
            <table style={{ width: '100%' }}>
              <tbody>
                <tr><td>Proses</td><td>{stats.proses}</td><td>{pct(stats.proses, stats.total)}%</td></tr>
                <tr><td>Selesai</td><td>{stats.selesai}</td><td>{pct(stats.selesai, stats.total)}%</td></tr>
                <tr><td>Dibatalkan</td><td>{stats.dibatalkan}</td><td>{pct(stats.dibatalkan, stats.total)}%</td></tr>
                <tr><td>Tervalidasi</td><td>{stats.tervalidasi}</td><td>{pct(stats.tervalidasi, stats.total)}%</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>📊 Statistik per Guru BK</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Guru BK</th>
              <th>Total</th>
              <th>Akademik</th>
              <th>Sosial</th>
              <th>Pribadi</th>
              <th>Bullying</th>
              <th>Proses</th>
              <th>Selesai</th>
              <th>Laporan</th>
              <th>% Selesai</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const rows = GURU_BK_LIST.map((guru) => {
                const konselingGuru = semuaKonseling.filter((item) => item.guru === guru.nama);
                if (konselingGuru.length === 0) return null;
                const total = konselingGuru.length;
                const akademik = konselingGuru.filter((item) => item.kategori === 'Akademik').length;
                const sosial = konselingGuru.filter((item) => item.kategori === 'Sosial').length;
                const pribadi = konselingGuru.filter((item) => item.kategori === 'Pribadi').length;
                const bullying = konselingGuru.filter((item) => item.kategori === 'Bullying').length;
                const proses = konselingGuru.filter((item) => item.status === 'Proses').length;
                const selesai = konselingGuru.filter((item) => item.status === 'Selesai').length;
                const laporan = konselingGuru.filter((item) => item.laporanGuru).length;
                const persenSelesai = ((selesai / total) * 100).toFixed(1);
                return (
                  <tr key={guru.id}>
                    <td><strong>{guru.nama}</strong></td>
                    <td>{total}</td>
                    <td>{akademik}</td>
                    <td>{sosial}</td>
                    <td>{pribadi}</td>
                    <td>{bullying}</td>
                    <td>{proses}</td>
                    <td>{selesai}</td>
                    <td>
                      <span className={`status-badge ${laporan === selesai ? 'status-selesai' : 'status-proses'}`}>
                        {laporan}/{selesai}
                      </span>
                    </td>
                    <td><span className="guru-value">{persenSelesai}%</span></td>
                  </tr>
                );
              }).filter(Boolean);
              return rows.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center' }}>Belum ada data</td>
                </tr>
              ) : (
                rows
              );
            })()}
          </tbody>
        </table>
      </div>
    </>
  );
}
