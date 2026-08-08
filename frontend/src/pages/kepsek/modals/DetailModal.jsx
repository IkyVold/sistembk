export default function DetailModal({ item, onClose }) {
  if (!item) return null;

  let laporanContent = null;
  if (item.laporanGuru) {
    const laporan = item.laporanGuru;
    let laporanStatusClass = 'status-tervalidasi';
    if (laporan.statusPenanganan?.includes('Selesai')) laporanStatusClass = 'status-selesai';
    else if (laporan.statusPenanganan?.includes('Monitoring')) laporanStatusClass = 'status-proses';

    laporanContent = (
      <div className="laporan-box">
        <div className="laporan-title">
          <span>📋</span> Laporan Hasil Konseling
        </div>
        <div className="laporan-item">
          <strong>📅 Tanggal Laporan:</strong>
          <p>{laporan.tanggalLaporan || '-'} • {laporan.waktuLaporan || '-'}</p>
        </div>
        <div className="laporan-item">
          <strong>👨‍🏫 Dibuat Oleh:</strong>
          <p>{laporan.dibuatOleh || item.guru}</p>
        </div>
        <div className="laporan-item">
          <strong>📝 Kesimpulan Konseling:</strong>
          <p>{laporan.kesimpulan || '-'}</p>
        </div>
        <div className="laporan-item">
          <strong>💡 Rekomendasi / Tindak Lanjut:</strong>
          <p>{laporan.rekomendasi || '-'}</p>
        </div>
        <div className="laporan-item">
          <strong>🏷️ Status Penanganan:</strong>
          <p><span className={`status-badge ${laporanStatusClass}`}>{laporan.statusPenanganan || '-'}</span></p>
        </div>
        {laporan.catatanTambahan && laporan.catatanTambahan !== '-' && (
          <div className="laporan-item">
            <strong>📌 Catatan Tambahan:</strong>
            <p>{laporan.catatanTambahan}</p>
          </div>
        )}
      </div>
    );
  } else if (item.status === 'Selesai') {
    laporanContent = (
      <div className="laporan-box" style={{ background: '#fff3cd', borderLeftColor: '#ffc107' }}>
        <div className="laporan-title" style={{ color: '#856404' }}>
          <span>⚠️</span> Belum Ada Laporan
        </div>
        <p style={{ fontSize: '13px', color: '#856404' }}>
          Konseling ini sudah selesai tetapi belum memiliki laporan hasil konseling dari Guru BK.
        </p>
      </div>
    );
  }

  let statusClass = 'status-proses';
  if (item.status === 'Selesai') statusClass = 'status-selesai';
  else if (item.status === 'Dibatalkan') statusClass = 'status-dibatalkan';

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h3>📋 Detail Konseling</h3>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <div className="detail-label">Siswa</div>
            <div className="detail-value"><strong>{item.namaSiswa}</strong> ({item.nisnSiswa})</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">NISN</div>
            <div className="detail-value">{item.nisnSiswa}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">TTL</div>
            <div className="detail-value">{item.ttlSiswa}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Jenis Kelamin</div>
            <div className="detail-value">{item.jenisKelaminSiswa}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Alamat</div>
            <div className="detail-value">{item.alamatSiswa}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Guru BK</div>
            <div className="detail-value"><span className="guru-badge">{item.guru}</span></div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Tanggal/Jam</div>
            <div className="detail-value">{item.tanggal} {item.jam}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Jenis/Kategori</div>
            <div className="detail-value">{item.jenis} • {item.kategori}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Status</div>
            <div className="detail-value">
              <span className={`status-badge ${statusClass}`}>{item.status}</span>{' '}
              <span className={`status-badge ${item.statusValidasi === 'Tervalidasi' ? 'status-tervalidasi' : 'status-proses'}`}>
                {item.statusValidasi}
              </span>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Deskripsi</div>
            <div className="detail-value">
              <div className="detail-deskripsi">{item.deskripsi || 'Tidak ada deskripsi'}</div>
            </div>
          </div>
          {laporanContent}
        </div>
        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}
