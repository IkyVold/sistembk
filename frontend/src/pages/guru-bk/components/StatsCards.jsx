const STAT_DEFS = [
  { key: 'total', className: 'stat-total', icon: '📋', label: 'Total Konseling' },
  { key: 'proses', className: 'stat-proses', icon: '⏳', label: 'Menunggu Konfirmasi' },
  { key: 'terkonfirmasi', className: 'stat-terkonfirmasi', icon: '✅', label: 'Sudah Dikonfirmasi' },
  { key: 'selesai', className: 'stat-selesai', icon: '✨', label: 'Selesai' },
  { key: 'dibatalkan', className: 'stat-dibatalkan', icon: '❌', label: 'Dibatalkan' },
];

export default function StatsCards({ stats }) {
  return (
    <div className="stats-grid">
      {STAT_DEFS.map((def) => (
        <div className={`stat-card ${def.className}`} key={def.key}>
          <div className="stat-icon">{def.icon}</div>
          <div className="stat-info">
            <h3>{def.label}</h3>
            <div className="stat-value">{stats[def.key] ?? 0}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
