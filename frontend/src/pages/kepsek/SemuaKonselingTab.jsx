import { useState, useMemo } from 'react';

export default function SemuaKonselingTab({ semuaKonseling, onDetail, onExportExcel }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [laporanFilter, setLaporanFilter] = useState('all');
  const [appliedSearch, setAppliedSearch] = useState('');

  const filtered = useMemo(() => {
    const term = appliedSearch.trim().toLowerCase();
    return semuaKonseling.filter((item) => {
      const matchSearch =
        !term ||
        (item.namaSiswa || '').toLowerCase().includes(term) ||
        (item.username || '').toLowerCase().includes(term) ||
        (item.guru || '').toLowerCase().includes(term) ||
        (item.kategori || '').toLowerCase().includes(term);

      const matchStatus = statusFilter === 'all' || item.status === statusFilter;

      const hasLaporan = Boolean(item.laporanGuru);
      let matchLaporan = true;
      if (laporanFilter === 'ada') matchLaporan = hasLaporan;
      else if (laporanFilter === 'tidak') matchLaporan = !hasLaporan;

      return matchSearch && matchStatus && matchLaporan;
    });
  }, [semuaKonseling, appliedSearch, statusFilter, laporanFilter]);

  return (
    <>
      <div className="content-header">
        <h2>📋 Semua Data Konseling</h2>
        <p>Data lengkap seluruh konseling siswa</p>
      </div>

      <div className="date-filter">
        <label>Filter:</label>
        <input
          type="text"
          placeholder="Cari nama siswa, guru, kategori..."
          style={{ flex: 1 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={{ padding: '10px', border: '2px solid #e2e8f0', borderRadius: '8px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Semua Status</option>
          <option value="Proses">Proses</option>
          <option value="Selesai">Selesai</option>
          <option value="Dibatalkan">Dibatalkan</option>
        </select>
        <select
          style={{ padding: '10px', border: '2px solid #e2e8f0', borderRadius: '8px' }}
          value={laporanFilter}
          onChange={(e) => setLaporanFilter(e.target.value)}
        >
          <option value="all">Semua Laporan</option>
          <option value="ada">Ada Laporan</option>
          <option value="tidak">Belum Ada Laporan</option>
        </select>
        <button className="filter-btn" onClick={() => setAppliedSearch(search)}>
          Cari
        </button>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>📋 Data Konseling</h3>
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
              <th>Tanggal</th>
              <th>Siswa</th>
              <th>NISN</th>
              <th>Guru BK</th>
              <th>Kategori</th>
              <th>Jenis</th>
              <th>Status Validasi</th>
              <th>Status</th>
              <th>Laporan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '40px' }}>
                  Tidak ada data konseling
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => {
                let statusClass = 'status-proses';
                if (item.status === 'Selesai') statusClass = 'status-selesai';
                else if (item.status === 'Dibatalkan') statusClass = 'status-dibatalkan';
                const validasiClass = item.statusValidasi === 'Tervalidasi' ? 'status-tervalidasi' : 'status-proses';

                return (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.tanggal || '-'}</td>
                    <td><strong>{item.namaSiswa || item.username}</strong></td>
                    <td>{item.nisnSiswa || '-'}</td>
                    <td><span className="guru-badge">{item.guru}</span></td>
                    <td>{item.kategori || '-'}</td>
                    <td>{item.jenis || '-'}</td>
                    <td><span className={`status-badge ${validasiClass}`}>{item.statusValidasi}</span></td>
                    <td><span className={`status-badge ${statusClass}`}>{item.status}</span></td>
                    <td>
                      {item.laporanGuru ? (
                        <span className="status-badge status-selesai">✅ Ada</span>
                      ) : (
                        <span className="status-badge status-proses">❌ Belum</span>
                      )}
                    </td>
                    <td>
                      <button className="export-btn btn-excel" style={{ padding: '5px 10px' }} onClick={() => onDetail(item.id)}>
                        <span>🔍</span> Detail
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
