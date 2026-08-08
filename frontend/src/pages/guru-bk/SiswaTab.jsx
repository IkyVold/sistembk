import KelasSelect from './components/KelasSelect';

export default function SiswaTab({
  siswaList,
  totalCount,
  searchTerm,
  filterKelas,
  filterJK,
  onSearchChange,
  onFilterKelasChange,
  onFilterJKChange,
  onTambahSiswa,
  onImportExcel,
  onImportAbsen,
  onEditKelas,
  isLoading,
  loadError,
}) {
  return (
    <div className="tab-panel active">
      <div className="table-container" style={{ marginTop: 0 }}>
        <div className="table-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <h3>👥 Daftar Siswa Terdaftar</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
              {isLoading ? 'Memuat data...' : `${siswaList.length} dari ${totalCount} siswa`}
            </div>
            <button
              className="btn-cetak"
              style={{ background: 'var(--green-500)', boxShadow: '0 2px 8px rgba(22,163,74,0.25)' }}
              onClick={onTambahSiswa}
            >
              <span>➕</span> Tambah Siswa
            </button>
            <button className="btn-cetak" onClick={onImportExcel}>
              <span>📥</span> Import Excel (Template)
            </button>
            <button
              className="btn-cetak"
              style={{ background: 'var(--brand-600)', boxShadow: '0 2px 8px rgba(79,70,229,0.25)' }}
              onClick={onImportAbsen}
            >
              <span>📋</span> Import dari Absen
            </button>
          </div>
        </div>

        <div className="siswa-search-bar">
          <input
            type="text"
            placeholder="🔍 Cari NIS atau nama siswa..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <KelasSelect value={filterKelas} onChange={(e) => onFilterKelasChange(e.target.value)} includeAllOption />
          <select value={filterJK} onChange={(e) => onFilterJKChange(e.target.value)}>
            <option value="">⚧ Semua</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>

        <div>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-600)' }}>⏳ Memuat daftar siswa...</div>
          )}
          {loadError && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--red-600)' }}>
              ❌ Gagal memuat data siswa. Pastikan server berjalan.
            </div>
          )}
          {!isLoading && !loadError && siswaList.length === 0 && (
            <div className="siswa-empty">
              <div className="empty-icon">👥</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '8px' }}>
                Tidak ada siswa ditemukan
              </div>
              <div style={{ fontSize: '14px' }}>Coba ubah kata kunci atau filter</div>
            </div>
          )}
          {!isLoading && !loadError && siswaList.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIS</th>
                  <th>Nama Siswa</th>
                  <th>Kelas Aktif</th>
                  <th>Tahun Ajaran</th>
                  <th>Jenis Kelamin</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {siswaList.map((s, idx) => (
                  <tr key={s.nis}>
                    <td style={{ fontWeight: 600 }}>{idx + 1}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.nis}</td>
                    <td><strong>{s.nama}</strong></td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          background: 'var(--purple-50)',
                          color: 'var(--purple-800)',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {s.kelas || '-'}
                      </span>
                    </td>
                    <td>
                      {s.tahun_ajaran ? (
                        <span
                          style={{
                            fontSize: '11px',
                            background: 'var(--coral-50)',
                            color: 'var(--coral-800)',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontWeight: 600,
                          }}
                        >
                          {s.tahun_ajaran}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td>
                      {s.jenis_kelamin === 'Laki-laki' && <span className="badge-jk-l">♂ Laki-laki</span>}
                      {s.jenis_kelamin === 'Perempuan' && <span className="badge-jk-p">♀ Perempuan</span>}
                      {!s.jenis_kelamin && '-'}
                    </td>
                    <td>
                      <button className="btn-edit-kelas-siswa" onClick={() => onEditKelas(s)}>
                        ✏️ Edit Kelas
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
