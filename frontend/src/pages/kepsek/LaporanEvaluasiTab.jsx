import { hitungStatistik, pct, getTopKategori, getTopGuru } from './helpers';

export default function LaporanEvaluasiTab({ semuaKonseling, onExportPDF }) {
  const stats = hitungStatistik(semuaKonseling);
  const laporanTersedia = semuaKonseling.filter((item) => item.laporanGuru).length;
  const tanpaLaporan = stats.selesai - laporanTersedia;
  const periode = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const topKategori = getTopKategori(stats);
  const topGuru = getTopGuru(semuaKonseling);
  const persenLaporanSelesai = stats.selesai > 0 ? ((laporanTersedia / stats.selesai) * 100).toFixed(1) : '0.0';

  return (
    <>
      <div className="content-header">
        <h2>📑 Laporan Evaluasi Layanan BK</h2>
        <p>Periode: {periode}</p>
      </div>

      <div className="summary-box">
        <div className="summary-title">📋 Ringkasan Eksekutif</div>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', lineHeight: 1.8 }}>
          <p>
            Selama periode ini, layanan Bimbingan dan Konseling telah melayani <strong>{stats.total}</strong> sesi
            konseling yang melibatkan <strong>{stats.siswaAktif}</strong> siswa dan <strong>{stats.guruAktif}</strong>{' '}
            guru BK.
          </p>

          <p style={{ marginTop: '15px' }}>
            📊 <strong>Distribusi Kategori:</strong>
            <br />
            - Akademik: {stats.akademik} kasus ({pct(stats.akademik, stats.total)}%)
            <br />
            - Sosial: {stats.sosial} kasus ({pct(stats.sosial, stats.total)}%)
            <br />
            - Pribadi: {stats.pribadi} kasus ({pct(stats.pribadi, stats.total)}%)
            <br />- Bullying: {stats.bullying} kasus ({pct(stats.bullying, stats.total)}%)
          </p>

          <p style={{ marginTop: '15px' }}>
            ✅ <strong>Tingkat Keberhasilan:</strong> {stats.selesai} sesi selesai ({pct(stats.selesai, stats.total)}%)
          </p>

          <p style={{ marginTop: '15px' }}>
            📋 <strong>Kelengkapan Laporan:</strong> {laporanTersedia} dari {stats.selesai} konseling selesai
            memiliki laporan ({persenLaporanSelesai}%)
          </p>

          {tanpaLaporan > 0 && (
            <p style={{ marginTop: '15px', color: 'var(--coral-400)' }}>
              ⚠️ <strong>Perhatian:</strong> Terdapat {tanpaLaporan} konseling yang sudah selesai tetapi belum
              memiliki laporan hasil konseling.
            </p>
          )}
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>📋 Rekomendasi dan Evaluasi</h3>
          <div className="export-buttons">
            <button className="export-btn btn-pdf" onClick={onExportPDF}>
              <span>📥</span> Unduh Laporan PDF
            </button>
          </div>
        </div>
        <div style={{ padding: '20px', background: 'var(--purple-50)', borderRadius: '12px' }}>
          <h4 style={{ marginBottom: '15px' }}>Kesimpulan:</h4>
          <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
            <li>Layanan konseling berjalan dengan baik, dengan tingkat penyelesaian {pct(stats.selesai, stats.total)}%</li>
            <li>
              Kategori {topKategori.name} menjadi masalah yang paling banyak dikonsultasikan ({topKategori.value}{' '}
              kasus)
            </li>
            <li>Perlu perhatian khusus pada {stats.bullying} kasus bullying yang dilaporkan</li>
            <li>Guru BK dengan kinerja tertinggi: {topGuru}</li>
            <li>
              Kelengkapan laporan hasil konseling: {laporanTersedia}/{stats.selesai} ({persenLaporanSelesai}%)
            </li>
          </ul>

          <h4 style={{ margin: '20px 0 15px' }}>Rekomendasi:</h4>
          <ul style={{ marginLeft: '20px', lineHeight: 1.8 }}>
            <li>Meningkatkan sosialisasi layanan konseling untuk menjangkau lebih banyak siswa</li>
            <li>Mengadakan pelatihan penanganan kasus bullying untuk guru BK</li>
            <li>Mempertimbangkan penambahan sesi konseling untuk kategori dengan permintaan tinggi</li>
            <li>Monitoring berkala terhadap kasus yang masih dalam proses</li>
            {tanpaLaporan > 0 && (
              <li>
                <strong>⚠️ Mendorong guru BK untuk segera melengkapi laporan hasil konseling</strong>
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}
