import { GURU_BK_LIST } from '../constants';

export default function GuruCards({ semuaKonseling }) {
  const guruStats = GURU_BK_LIST.map((guru) => {
    const konselingGuru = semuaKonseling.filter((item) => item.guru === guru.nama);
    const total = konselingGuru.length;
    const selesai = konselingGuru.filter((item) => item.status === 'Selesai').length;
    const proses = konselingGuru.filter((item) => item.status === 'Proses').length;
    const denganLaporan = konselingGuru.filter((item) => item.laporanGuru).length;
    return { ...guru, total, selesai, proses, denganLaporan };
  })
    .filter((g) => g.total > 0)
    .sort((a, b) => b.total - a.total);

  if (guruStats.length === 0) {
    return (
      <div className="guru-grid">
        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#718096' }}>
          Belum ada aktivitas konseling
        </div>
      </div>
    );
  }

  return (
    <div className="guru-grid">
      {guruStats.map((guru) => (
        <div className="guru-card" key={guru.id}>
          <div className="guru-avatar">{guru.nama.charAt(0)}</div>
          <div className="guru-info">
            <div className="guru-name">{guru.nama}</div>
            <div className="guru-stats">
              Total: <span className="guru-value">{guru.total}</span> | Selesai:{' '}
              <span className="guru-value">{guru.selesai}</span> | Laporan:{' '}
              <span className="guru-value">{guru.denganLaporan}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
