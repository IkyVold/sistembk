import { GURU_BK_LIST } from './constants';

export default function RekapGuruTab({ semuaKonseling, onExportExcel }) {
  return (
    <>
      <div className="content-header">
        <h2>👨‍🏫 Rekap Aktivitas Guru BK</h2>
        <p>Rekapitulasi kinerja guru bimbingan konseling</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>📋 Rekap Guru BK</h3>
          <div className="export-buttons">
            <button className="export-btn btn-excel" onClick={onExportExcel}>
              <span>📥</span> Export Excel
            </button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Guru</th>
              <th>Total Konseling</th>
              <th>Akademik</th>
              <th>Sosial</th>
              <th>Pribadi</th>
              <th>Bullying</th>
              <th>Proses</th>
              <th>Selesai</th>
              <th>Dibatalkan</th>
              <th>Dengan Laporan</th>
            </tr>
          </thead>
          <tbody>
            {GURU_BK_LIST.map((guru, index) => {
              const konselingGuru = semuaKonseling.filter((item) => item.guru === guru.nama);
              if (konselingGuru.length === 0) {
                return (
                  <tr key={guru.id}>
                    <td>{index + 1}</td>
                    <td>{guru.nama}</td>
                    <td colSpan={10} style={{ color: '#718096', textAlign: 'center' }}>
                      Belum ada data konseling
                    </td>
                  </tr>
                );
              }
              const akademik = konselingGuru.filter((item) => item.kategori === 'Akademik').length;
              const sosial = konselingGuru.filter((item) => item.kategori === 'Sosial').length;
              const pribadi = konselingGuru.filter((item) => item.kategori === 'Pribadi').length;
              const bullying = konselingGuru.filter((item) => item.kategori === 'Bullying').length;
              const proses = konselingGuru.filter((item) => item.status === 'Proses').length;
              const selesai = konselingGuru.filter((item) => item.status === 'Selesai').length;
              const dibatalkan = konselingGuru.filter((item) => item.status === 'Dibatalkan').length;
              const denganLaporan = konselingGuru.filter((item) => item.laporanGuru).length;

              return (
                <tr key={guru.id}>
                  <td>{index + 1}</td>
                  <td><strong>{guru.nama}</strong></td>
                  <td><span className="guru-value">{konselingGuru.length}</span></td>
                  <td>{akademik}</td>
                  <td>{sosial}</td>
                  <td>{pribadi}</td>
                  <td>{bullying}</td>
                  <td><span className="status-badge status-proses">{proses}</span></td>
                  <td><span className="status-badge status-selesai">{selesai}</span></td>
                  <td><span className="status-badge status-dibatalkan">{dibatalkan}</span></td>
                  <td><span className="status-badge status-tervalidasi">{denganLaporan}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
