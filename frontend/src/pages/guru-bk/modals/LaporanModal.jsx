import { useState, useEffect } from 'react';
import Modal from './Modal';
import { STATUS_PENANGANAN_OPTIONS, JAM_LIST } from '../constants';
import { sisaWaktuEditText } from '../helpers';

function defaultLanjutanTanggal() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function LaporanModal({ item, onClose, onSave }) {
  const isEdit = Boolean(item?.laporanGuru);

  const [kesimpulan, setKesimpulan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [statusPenanganan, setStatusPenanganan] = useState('Selesai - Masalah Teratasi');
  const [catatanTambahan, setCatatanTambahan] = useState('');
  const [buatLanjutan, setBuatLanjutan] = useState(false);
  const [lanjutanTanggal, setLanjutanTanggal] = useState(defaultLanjutanTanggal());
  const [lanjutanJam, setLanjutanJam] = useState('09:00');
  const [lanjutanJenis, setLanjutanJenis] = useState('Luring');

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
    setBuatLanjutan(false);
    setLanjutanTanggal(defaultLanjutanTanggal());
    setLanjutanJam('09:00');
    setLanjutanJenis(item.jenis === 'Daring' ? 'Daring' : 'Luring');
  }, [item]);

  useEffect(() => {
    if (statusPenanganan === 'Monitoring' && !isEdit) {
      setBuatLanjutan(true);
    }
  }, [statusPenanganan, isEdit]);

  if (!item) return null;

  const showLanjutanOption = statusPenanganan === 'Monitoring' && !isEdit;

  function handleSave() {
    if (!kesimpulan.trim()) {
      alert('Kesimpulan konseling harus diisi!');
      return;
    }
    if (!rekomendasi.trim()) {
      alert('Rekomendasi / tindak lanjut harus diisi!');
      return;
    }
    if (buatLanjutan && showLanjutanOption) {
      if (!lanjutanTanggal || !lanjutanJam) {
        alert('Tanggal dan jam sesi lanjutan wajib diisi!');
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      if (lanjutanTanggal < today) {
        alert('Tanggal sesi lanjutan tidak boleh di masa lalu!');
        return;
      }
    }

    onSave(item.id, {
      kesimpulan: kesimpulan.trim(),
      rekomendasi: rekomendasi.trim(),
      statusPenanganan,
      catatanTambahan: catatanTambahan.trim(),
      buatLanjutan: Boolean(buatLanjutan && showLanjutanOption),
      lanjutan:
        buatLanjutan && showLanjutanOption
          ? {
              tanggal: lanjutanTanggal,
              jam: lanjutanJam,
              jenis: lanjutanJenis,
              kategori: item.kategori,
              deskripsi: `Sesi lanjutan dari konseling #${item.id}. ${rekomendasi.trim()}`.slice(0, 500),
            }
          : null,
    });
  }

  const footer = (
    <>
      <button className="btn btn-batal" onClick={onClose}>
        Batal
      </button>
      <button className="btn btn-selesai" onClick={handleSave}>
        {buatLanjutan && showLanjutanOption
          ? 'Simpan Laporan + Buat Sesi Lanjutan'
          : 'Simpan Laporan & Selesaikan'}
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
          Mode edit — {sisaWaktuEditText(item.laporanCreatedAt)}
        </div>
      )}

      <div className="validation-form">
        <div className="validation-title">
          <span>👤</span> Informasi Konseling
        </div>
        <div className="validation-field">
          <label>Siswa:</label>
          <div style={{ flex: 1, padding: '10px', background: 'var(--gray-50)', borderRadius: '8px' }}>
            <strong>{item.namaSiswa}</strong> ({item.nisnSiswa})
          </div>
        </div>
        <div className="validation-field">
          <label>Tanggal/Jam:</label>
          <div style={{ flex: 1, padding: '10px', background: 'var(--gray-50)', borderRadius: '8px' }}>
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

        {showLanjutanOption && (
          <div
            style={{
              marginTop: '16px',
              padding: '14px 16px',
              background: 'var(--blue-50, #eff6ff)',
              border: '1px solid var(--blue-200, #bfdbfe)',
              borderRadius: '10px',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13.5px',
                color: 'var(--blue-800, #1e40af)',
              }}
            >
              <input
                type="checkbox"
                checked={buatLanjutan}
                onChange={(e) => setBuatLanjutan(e.target.checked)}
                style={{ marginTop: '3px', width: 16, height: 16 }}
              />
              <span>
                Buat pengajuan sesi lanjutan otomatis
                <div style={{ fontWeight: 400, fontSize: '12px', color: 'var(--gray-600)', marginTop: 4 }}>
                  Sistem akan membuat pengajuan baru yang terhubung ke sesi ini. Siswa mendapat notifikasi.
                </div>
              </span>
            </label>

            {buatLanjutan && (
              <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                <div className="validation-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="lanjutanTanggal">Tanggal sesi lanjutan:</label>
                  <input
                    id="lanjutanTanggal"
                    type="date"
                    value={lanjutanTanggal}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setLanjutanTanggal(e.target.value)}
                  />
                </div>
                <div className="validation-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="lanjutanJam">Jam:</label>
                  <select
                    id="lanjutanJam"
                    value={lanjutanJam}
                    onChange={(e) => setLanjutanJam(e.target.value)}
                  >
                    {JAM_LIST.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="validation-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="lanjutanJenis">Jenis:</label>
                  <select
                    id="lanjutanJenis"
                    value={lanjutanJenis}
                    onChange={(e) => setLanjutanJenis(e.target.value)}
                  >
                    <option value="Luring">Luring</option>
                    <option value="Daring">Daring</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
