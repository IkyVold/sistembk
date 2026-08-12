import StatsCards from './components/StatsCards';
import KonselingTable from './components/KonselingTable';
import KelasSelect from './components/KelasSelect';

const FILTER_TITLES = {
  all: '📋 Semua Konseling',
  proses: '⏳ Menunggu Konfirmasi',
  terkonfirmasi: '✅ Sudah Dikonfirmasi',
  selesai: '✨ Selesai',
  dibatalkan: '❌ Dibatalkan',
};

const EMPTY_MESSAGES = {
  all: (guru) => `Belum ada permintaan konseling dari siswa untuk ${guru}`,
  proses: (guru) => `Belum ada permintaan konseling dari siswa untuk ${guru}`,
  terkonfirmasi: (guru) => `Belum ada permintaan konseling dari siswa untuk ${guru}`,
  selesai: (guru) => `Belum ada permintaan konseling dari siswa untuk ${guru}`,
  dibatalkan: (guru) => `Belum ada permintaan konseling dari siswa untuk ${guru}`,
};

export default function KonselingTab({
  guruNama,
  stats,
  currentFilter,
  filteredData,
  tahunAjaranOptions,
  searchTerm,
  filterKelas,
  filterTahun,
  onSearchChange,
  onFilterKelasChange,
  onFilterTahunChange,
  onWalkin,
  onCetak,
  onDetail,
  onKonfirmasi,
  onLaporan,
  onBatal,
  onChat,
  onLihatLaporan,
  onEditLaporan,
}) {
  return (
    <div className="tab-panel active">
      <StatsCards stats={stats} />

      <div className="table-container">
        <div className="table-header">
          <h3>{FILTER_TITLES[currentFilter] || FILTER_TITLES.all}</h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={filterTahun}
              onChange={(e) => onFilterTahunChange(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--gray-100)',
                fontSize: '13.5px',
                background: '#fff',
                cursor: 'pointer',
                minWidth: '150px',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <option value="">📅 Semua Tahun</option>
              {tahunAjaranOptions.map((tahun) => (
                <option value={tahun} key={tahun}>
                  {tahun}
                </option>
              ))}
            </select>
            <KelasSelect value={filterKelas} onChange={(e) => onFilterKelasChange(e.target.value)} includeAllOption />
            <input
              type="text"
              className="search-box"
              placeholder="🔍 Cari nama siswa, NIS, atau deskripsi..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <button
              className="btn-cetak"
              style={{ background: 'var(--green-500)', boxShadow: '0 2px 8px rgba(22,163,74,0.25)' }}
              onClick={onWalkin}
            >
              <span>➕</span> akses konseling (guru BK)
            </button>
            <button className="btn-cetak" onClick={onCetak}>
              <span>🖨️</span> Cetak Laporan PDF
            </button>
          </div>
        </div>

        <div>
          <KonselingTable
            data={filteredData}
            emptyMessage={(EMPTY_MESSAGES[currentFilter] || EMPTY_MESSAGES.all)(guruNama)}
            onDetail={onDetail}
            onKonfirmasi={onKonfirmasi}
            onLaporan={onLaporan}
            onBatal={onBatal}
            onChat={onChat}
            onLihatLaporan={onLihatLaporan}
            onEditLaporan={onEditLaporan}
          />
        </div>
      </div>
    </div>
  );
}
