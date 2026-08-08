import { useState, useEffect } from 'react';
import Modal from './Modal';
import { STATUS_PENANGANAN_OPTIONS } from '../constants';
import { sisaWaktuEditText } from '../helpers';

export default function LaporanModal({ item, onClose, onSave }) {
  const isEdit = Boolean(item?.laporanGuru);

  const [kesimpulan, setKesimpulan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [statusPenanganan, setStatusPenanganan] = useState('Selesai - Masalah Teratasi');
  const [catatanTambahan, setCatatanTambahan] = useState('');

  useEffect(() => {
    if (!item) return;
    if (item.laporanGuru) {
      setKesimpulan(item.laporanGuru.kesimpulan || '');
      setRekomendasi(item.laporanGuru.rekomendasi || '');
      setStatusPenanganan(item.laporanGuru.statusPenanganan || 'Selesai - Masalah Teratasi');
      setCatatanTambahan(
        item.laporanGuru.catatanTambahan && item.laporanGuru.catatanTambahan !== '-'
          ? item.laporanGuru.catatanTambahan
          : ''
      );
    } else {
      setKesimpulan('');
      setRekomendasi('');
      setStatusPenanganan('Selesai - Masalah Teratasi');
      setCatatanTambahan('');
    }
  }, [item]);

  if (!item) return null;

  function handleSave() {
    if (!kesimpulan.trim()) {
      alert('Kesimpulan konseling harus diisi!');
      return;
    }
    if (!rekomendasi.trim()) {
      alert('Rekomendasi / tindak lanjut harus diisi!');
      return;
    }
    onSave(item.id, {
      kesimpulan: kesimpulan.trim(),
      rekomendasi: rekomendasi.trim(),
      statusPenanganan,
      catatanTambahan: catatanTambahan.trim(),
    });
  }

  const footer = (
    <>
      <button className="btn btn-batal" onClick={onClose}>
        Batal
      </button>
      <button className="btn btn-selesai" onClick={handleSave}>
        Simpan Laporan &amp; Selesaikan
      </button>
    </>
  );

  return (
    <Modal
      show={Boolean(item)}
      onClose={onClose}
      title={isEdit ? '✏️ Edit Laporan Hasil Konseling' : '📝 Buat Laporan Hasil Konseling'}
      footer={footer}
    >
      {isEdit && (
        <div
          style={{
            background: 'var(--amber-50)',
            borderLeft: '4px solid var(--amber-500)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            fontSize: '12.5px',
            color: 'var(--amber-700)',
          }}
        >
          ⏳ {sisaWaktuEditText(item.laporanCreatedAt)}. Setelah lewat, laporan ini terkunci permanen.
        </div>
      )}

      <div className="validation-section">
        <div className="validation-title">
          <span>📋</span> Informasi Konseling
        </div>
        <div className="validation-field">
          <label>Siswa:</label>
          <div style={{ flex: 1, padding: '10px', background: '#f0f0f0', borderRadius: '8px' }}>
            <strong>{item.namaSiswa}</strong> ({item.nisnSiswa})
          </div>
        </div>
        <div className="validation-field">
          <label>Tanggal/Jam:</label>
          <div style={{ flex: 1, padding: '10px', background: '#f0f0f0', borderRadius: '8px' }}>
            {item.tanggal} • {item.jam}
          </div>
        </div>

        <div className="validation-title" style={{ marginTop: '20px' }}>
          <span>📝</span> Laporan Hasil Konseling
        </div>

        <div className="validation-field">
          <label htmlFor="kesimpulan">Kesimpulan Konseling:</label>
          <textarea
            id="kesimpulan"
            rows={3}
            placeholder="Ringkasan hasil konseling, apa yang sudah dibahas dan disepakati..."
            value={kesimpulan}
            onChange={(e) => setKesimpulan(e.target.value)}
          />
        </div>

        <div className="validation-field">
          <label htmlFor="rekomendasi">Rekomendasi / Tindak Lanjut:</label>
          <textarea
            id="rekomendasi"
            rows={3}
            placeholder="Saran untuk siswa, langkah selanjutnya, atau rujukan ke pihak lain..."
            value={rekomendasi}
            onChange={(e) => setRekomendasi(e.target.value)}
          />
        </div>

        <div className="validation-field">
          <label htmlFor="statusPenanganan">Status Penanganan:</label>
          <select
            id="statusPenanganan"
            value={statusPenanganan}
            onChange={(e) => setStatusPenanganan(e.target.value)}
          >
            {STATUS_PENANGANAN_OPTIONS.map((opt) => (
              <option value={opt.value} key={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="validation-field">
          <label htmlFor="catatanTambahan">Catatan Tambahan (opsional):</label>
          <textarea
            id="catatanTambahan"
            rows={2}
            placeholder="Informasi tambahan yang perlu dicatat..."
            value={catatanTambahan}
            onChange={(e) => setCatatanTambahan(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
