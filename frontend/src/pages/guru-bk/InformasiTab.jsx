import { KATEGORI_INFORMASI_LIST } from './constants';

function truncate(text, max = 120) {
  return text.length > max ? `${text.substring(0, max)}...` : text;
}

export default function InformasiTab({
  informasiList,
  totalCount,
  searchTerm,
  filterKategori,
  onSearchChange,
  onFilterKategoriChange,
  onTambah,
  onEdit,
  onHapus,
  isLoading,
  loadError,
}) {
  return (
    <div className="tab-panel active">
      <div className="table-container" style={{ marginTop: 0 }}>
        <div className="table-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <h3>💡 Informasi &amp; FAQ untuk Chatbot Siswa</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '13px', color: '#718096' }}>
              {isLoading ? 'Memuat data...' : `${totalCount} informasi tersimpan`}
            </div>
            <button
              className="btn-cetak"
              style={{ background: 'var(--green-500)', boxShadow: '0 2px 8px rgba(22,163,74,0.25)' }}
              onClick={onTambah}
            >
              <span>➕</span> Tambah Informasi
            </button>
          </div>
        </div>

        <div
          style={{
            background: 'var(--blue-50)',
            borderLeft: '4px solid var(--blue-500)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            margin: '16px 0',
            fontSize: '12.5px',
            color: 'var(--blue-700)',
          }}
        >
          ℹ️ Informasi di sini otomatis dijadikan referensi jawaban oleh <strong>chatbot AI</strong> yang siswa
          akses dari halaman Beranda. Cocok buat info beasiswa, jalur pendaftaran perguruan tinggi (SNBP/SNBT/
          mandiri), bimbingan karir, atau pengumuman sekolah.
        </div>

        <div className="siswa-search-bar">
          <input
            type="text"
            placeholder="🔍 Cari judul atau isi informasi..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <select value={filterKategori} onChange={(e) => onFilterKategoriChange(e.target.value)}>
            <option value="">🏷️ Semua Kategori</option>
            {KATEGORI_INFORMASI_LIST.map((k) => (
              <option value={k} key={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>⏳ Memuat informasi...</div>
          )}
          {loadError && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#e53e3e' }}>
              ❌ Gagal memuat informasi. Pastikan server berjalan.
            </div>
          )}
          {!isLoading && !loadError && informasiList.length === 0 && (
            <div className="siswa-empty">
              <div className="empty-icon">💡</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#2d3748', marginBottom: '8px' }}>
                Belum ada informasi
              </div>
              <div style={{ fontSize: '14px' }}>
                Tambahkan info beasiswa, pendaftaran PT, atau karir supaya chatbot bisa menjawabnya ke siswa
              </div>
            </div>
          )}
          {!isLoading && !loadError && informasiList.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Kategori</th>
                  <th>Isi</th>
                  <th>Diperbarui</th>
                  <th>Oleh</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {informasiList.map((info) => (
                  <tr key={info.id}>
                    <td style={{ fontWeight: 600, maxWidth: '200px' }}>{info.judul}</td>
                    <td><span className="badge-tahun">{info.kategori}</span></td>
                    <td style={{ maxWidth: '280px', fontSize: '12.5px', color: 'var(--ink-500)' }}>
                      {truncate(info.isi)}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--ink-500)' }}>
                      {info.updated_at ? new Date(info.updated_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--ink-500)' }}>{info.guru_bk}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-validasi" onClick={() => onEdit(info)}>
                          <span>✏️</span> Edit
                        </button>
                        <button className="btn btn-batal" onClick={() => onHapus(info.id)}>
                          <span>🗑️</span> Hapus
                        </button>
                      </div>
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
