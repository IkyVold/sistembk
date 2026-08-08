import Modal from './Modal';

export default function LaporanDetailModal({ item, onClose }) {
  if (!item?.laporanGuru) return null;
  const laporan = item.laporanGuru;

  let statusClass = 'status-tervalidasi';
  if (laporan.statusPenanganan.includes('Selesai')) statusClass = 'status-selesai';
  else if (laporan.statusPenanganan.includes('Monitoring')) statusClass = 'status-proses';
  else if (laporan.statusPenanganan.includes('Rujuk')) statusClass = 'status-dibatalkan';

  const footer = (
    <button className="btn btn-detail" onClick={onClose}>
      Tutup
    </button>
  );

  return (
    <Modal show={Boolean(item)} onClose={onClose} title="📄 Detail Laporan Konseling" footer={footer}>
      <div className="laporan-box" style={{ background: '#e8f5e9' }}>
        <div className="laporan-title">
          <span>📋</span> Laporan Hasil Konseling
        </div>
        <div className="laporan-item">
          <strong>📅 Tanggal Laporan:</strong>
          <p>{laporan.tanggalLaporan} • {laporan.waktuLaporan}</p>
        </div>
        <div className="laporan-item">
          <strong>👨‍🏫 Dibuat Oleh:</strong>
          <p>{laporan.dibuatOleh}</p>
        </div>
        <div className="laporan-item">
          <strong>📝 Kesimpulan Konseling:</strong>
          <p>{laporan.kesimpulan}</p>
        </div>
        <div className="laporan-item">
          <strong>💡 Rekomendasi / Tindak Lanjut:</strong>
          <p>{laporan.rekomendasi}</p>
        </div>
        <div className="laporan-item">
          <strong>🏷️ Status Penanganan:</strong>
          <p><span className={`status-badge ${statusClass}`}>{laporan.statusPenanganan}</span></p>
        </div>
        {laporan.catatanTambahan && laporan.catatanTambahan !== '-' && (
          <div className="laporan-item">
            <strong>📌 Catatan Tambahan:</strong>
            <p>{laporan.catatanTambahan}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
