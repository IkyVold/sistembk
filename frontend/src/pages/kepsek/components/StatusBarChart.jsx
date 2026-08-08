const BARS = [
  { key: 'proses', label: 'Proses', color: '#ffc107' },
  { key: 'selesai', label: 'Selesai', color: '#28a745' },
  { key: 'dibatalkan', label: 'Dibatalkan', color: '#dc3545' },
  { key: 'tervalidasi', label: 'Tervalidasi', color: '#004085' },
];

export default function StatusBarChart({ stats }) {
  const max = Math.max(stats.proses, stats.selesai, stats.dibatalkan, stats.tervalidasi) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {BARS.map((bar) => (
        <div key={bar.key}>
          <strong>{bar.label}</strong> <span style={{ float: 'right' }}>{stats[bar.key]}</span>
          <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', marginTop: '4px' }}>
            <div
              style={{
                width: `${(stats[bar.key] / max) * 100}%`,
                background: bar.color,
                height: '8px',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
