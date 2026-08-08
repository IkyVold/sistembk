const BARS = [
  { key: 'proses', label: 'Proses', color: 'var(--coral-400)' },
  { key: 'selesai', label: 'Selesai', color: 'var(--teal-400)' },
  { key: 'dibatalkan', label: 'Dibatalkan', color: 'var(--red-600)' },
  { key: 'tervalidasi', label: 'Tervalidasi', color: 'var(--purple-800)' },
];

export default function StatusBarChart({ stats }) {
  const max = Math.max(stats.proses, stats.selesai, stats.dibatalkan, stats.tervalidasi) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {BARS.map((bar) => (
        <div key={bar.key}>
          <strong>{bar.label}</strong> <span style={{ float: 'right' }}>{stats[bar.key]}</span>
          <div style={{ background: 'var(--gray-100)', height: '8px', borderRadius: '4px', marginTop: '4px' }}>
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
