const MENU_ITEMS = [
  { key: 'all', icon: '📊', label: 'Semua Konseling', showNotif: 'all' },
  { key: 'proses', icon: '⏳', label: 'Menunggu Validasi', showNotif: 'proses' },
  { key: 'tervalidasi', icon: '✅', label: 'Sudah Divalidasi' },
  { key: 'selesai', icon: '✨', label: 'Selesai' },
  { key: 'dibatalkan', icon: '❌', label: 'Dibatalkan' },
];

export default function Sidebar({ activeTab, currentFilter, prosesCount, onSelectKonseling, onSelectSiswa, onSelectInformasi }) {
  const activeIndex = activeTab === 'konseling' ? MENU_ITEMS.findIndex((m) => m.key === currentFilter) : -1;

  return (
    <div className="sidebar">
      <ul className="sidebar-menu">
        {MENU_ITEMS.map((item, index) => (
          <li key={item.key}>
            <a
              className={activeIndex === index ? 'active' : ''}
              onClick={() => onSelectKonseling(item.key)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.showNotif && prosesCount > 0 && (
                <span className="notification-badge">{prosesCount}</span>
              )}
            </a>
          </li>
        ))}
        <li style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          <a className={activeTab === 'siswa' ? 'active' : ''} onClick={onSelectSiswa}>
            <span className="menu-icon">👥</span>
            <span>Daftar Siswa</span>
          </a>
        </li>
        <li>
          <a className={activeTab === 'informasi' ? 'active' : ''} onClick={onSelectInformasi}>
            <span className="menu-icon">💡</span>
            <span>Informasi / FAQ</span>
          </a>
        </li>
      </ul>
    </div>
  );
}
