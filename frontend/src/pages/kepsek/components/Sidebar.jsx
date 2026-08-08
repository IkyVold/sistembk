const MENU_ITEMS = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard' },
  { key: 'rekap-guru', icon: '👨‍🏫', label: 'Rekap Guru BK' },
  { key: 'semua-konseling', icon: '📋', label: 'Semua Konseling' },
  { key: 'statistik', icon: '📈', label: 'Statistik Lengkap' },
  { key: 'laporan', icon: '📑', label: 'Laporan Evaluasi' },
];

export default function Sidebar({ activeTab, onSelect }) {
  return (
    <div className="sidebar">
      <ul className="sidebar-menu">
        {MENU_ITEMS.map((item) => (
          <li key={item.key}>
            <a className={activeTab === item.key ? 'active' : ''} onClick={() => onSelect(item.key)}>
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
