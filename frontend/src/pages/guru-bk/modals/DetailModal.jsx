import { useState, useEffect } from 'react';
import Modal from './Modal';
import Avatar from '../../../components/Avatar';
import { JAM_LIST, LAPORAN_EDIT_WINDOW_HOURS } from '../constants';

export default function DetailModal({ item, onClose, onValidasi, onBatal, onLaporan, onEditLaporan }) {
  const [tanggalValidasi, setTanggalValidasi] = useState('');
  const [jamValidasi, setJamValidasi] = useState('');

  useEffect(() => {
    if (item) {
      setTanggalValidasi(item.tanggalRaw || '');
      setJamValidasi(item.jam || '');
    }
  }, [item]);

  if (!item) return null;

  const userNama = item.namaSiswa || item.nisnSiswa;
  const statusValidasiClass = item.statusValidasi === 'Tervalidasi' ? 'status-selesai' : 'status-proses';
  const belumValidasi = item.statusValidasi !== 'Tervalidasi' && item.status === 'Proses';
  const sudahValidasiBelumSelesai = item.statusValidasi === 'Tervalidasi' && item.status === 'Proses';
  const laporan = item.laporanGuru;

  let footer;
  if (belumValidasi) {
    footer = (
      <>
        <button className="btn btn-validasi" onClick={() => onValidasi(item, { tanggal: tanggalValidasi, jam: jamValidasi })}>
          <span>✅</span> Validasi Jadwal
        </button>
        <button className="btn btn-batal" onClick={() => onBatal(item)}>
          <span>❌</span> Batalkan
        </button>
        <button className="btn btn-detail" onClick={onClose}>
          <span>📁</span> Tutup
        </button>
      </>
    );
  } else if (sudahValidasiBelumSelesai) {
    footer = (
      <>
        <button className="btn btn-validasi" onClick={() => onValidasi(item, { tanggal: tanggalValidasi, jam: jamValidasi })}>
          <span>🔄</span> Ubah Jadwal
        </button>
        <button className="btn btn-laporan" onClick={() => onLaporan(item.id)}>
          <span>📝</span> Buat Laporan
        </button>
        <button className="btn btn-batal" onClick={() => onBatal(item)}>
          <span>❌</span> Batalkan
        </button>
        <button className="btn btn-detail" onClick={onClose}>
          <span>📁</span> Tutup
        </button>
      </>
    );
  } else if (item.status === 'Selesai' && laporan) {
    footer = (
      <>
        {item.canEditLaporan ? (
          <button className="btn btn-laporan" onClick={() => onEditLaporan(item.id)}>
            <span>✏️</span> Edit Laporan
          </button>
        ) : (
          <span
            className="btn"
            style={{ background: 'var(--ink-100)', color: 'var(--ink-400)', cursor: 'not-allowed' }}
            title={`Sudah lewat ${LAPORAN_EDIT_WINDOW_HOURS} jam sejak disimpan`}
          >
            <span>🔒</span> Laporan Terkunci
          </span>
        )}
        <button className="btn btn-detail" onClick={onClose}>
          <span>📁</span> Tutup
        </button>
      </>
    );
  } else {
    footer = (
      <button className="btn btn-detail" onClick={onClose}>
        <span>📁</span> Tutup
      </button>
    );
  }

  let laporanStatusClass = 'status-tervalidasi';
  if (laporan?.statusPenanganan?.includes('Selesai')) laporanStatusClass = 'status-selesai';
  else if (laporan?.statusPenanganan?.includes('Monitoring')) laporanStatusClass = 'status-proses';

  return (
    <Modal show={Boolean(item)} onClose={onClose} title="📋 Detail Konseling & Validasi Jadwal" footer={footer}>
      <div
        style={{
          marginBottom: '25px',
          padding: '15px',
          background: 'linear-gradient(135deg, var(--purple-600)15 0%, var(--purple-800)15 100%)',
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Avatar
            src={item.fotoSiswa}
            name={userNama}
            size={50}
            className="detail-modal-avatar"
          />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gray-800)' }}>
              {userNama}{' '}
              {item.inputManual && (
                <span
                  style={{
                    display: 'inline-block',
                    marginLeft: '6px',
                    padding: '2px 10px',
                    background: 'var(--green-100)',
                    color: 'var(--green-700)',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    verticalAlign: 'middle',
                  }}
                >
                  ✍️ Walk-in
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '15px', marginTop: '5px', color: 'var(--gray-600)', fontSize: '13px' }}>
              <span>NIS: {item.nisnSiswa}</span>
              <span>•</span>
              <span>Kelas: {item.kelasSiswa || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-row">
        <div className="detail-label">Informasi Konseling:</div>
        <div className="detail-value">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div><strong>Guru BK:</strong> {item.guru || '-'}</div>
            <div><strong>NPSN:</strong> {item.npsn || '-'}</div>
            <div><strong>Tanggal:</strong> {item.tanggal || '-'}</div>
            <div><strong>Jam:</strong> {item.jam || '-'}</div>
            <div><strong>Jenis:</strong> {item.jenis || '-'}</div>
            <div><strong>Kategori:</strong> {item.kategori || '-'}</div>
          </div>
        </div>
      </div>

      <div className="detail-row">
        <div className="detail-label">Validasi Jadwal:</div>
        <div className="detail-value">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '15px',
              background: 'var(--purple-50)',
              padding: '15px',
              borderRadius: '12px',
            }}
          >
            <div>
              <div style={{ color: 'var(--gray-600)', fontSize: '12px' }}>Tanggal Validasi</div>
              <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{item.tanggalValidasi || '-'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--gray-600)', fontSize: '12px' }}>Jam Validasi</div>
              <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{item.jamValidasi || '-'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--gray-600)', fontSize: '12px' }}>Status Validasi</div>
              <div><span className={`status-badge ${statusValidasiClass}`}>{item.statusValidasi || 'Belum Divalidasi'}</span></div>
            </div>
            <div>
              <div style={{ color: 'var(--gray-600)', fontSize: '12px' }}>Status Konseling</div>
              <div><span className={`status-badge status-${(item.status || 'Proses').toLowerCase()}`}>{item.status || 'Proses'}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-row">
        <div className="detail-label">Deskripsi Masalah:</div>
        <div className="detail-value">
          <div className="detail-deskripsi">
            {(item.deskripsi || 'Tidak ada deskripsi masalah yang disertakan')
              .split('\n')
              .map((par, i) =>
                par ? <p key={i} style={{ marginBottom: '10px' }}>{par}</p> : <br key={i} />
              )}
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--gray-600)', display: 'flex', justifyContent: 'flex-end' }}>
            <span>Diajukan pada: {item.tanggalPengajuan || item.tanggal || '-'}</span>
          </div>
        </div>
      </div>

      {item.status === 'Dibatalkan' && item.alasanBatal && (
        <div className="detail-row">
          <div className="detail-label">Alasan Pembatalan:</div>
          <div className="detail-value">
            <div
              className="detail-deskripsi"
              style={{ background: '#FDF6F6', border: '1px solid #F0B8B8', borderRadius: 10, padding: 12 }}
            >
              {item.alasanBatal}
            </div>
          </div>
        </div>
      )}

      {laporan && (
        <div className="laporan-box">
          <div className="laporan-title">
            <span>📋</span> Laporan Hasil Konseling
          </div>
          <div className="laporan-item">
            <strong>📅 Tanggal Laporan:</strong>
            <p>{laporan.tanggalLaporan} • {laporan.waktuLaporan}</p>
          </div>
          <div className="laporan-item">
            <strong>📝 Kesimpulan:</strong>
            <p>{laporan.kesimpulan}</p>
          </div>
          <div className="laporan-item">
            <strong>💡 Rekomendasi:</strong>
            <p>{laporan.rekomendasi}</p>
          </div>
          <div className="laporan-item">
            <strong>🏷️ Status Penanganan:</strong>
            <p><span className={`status-badge ${laporanStatusClass}`}>{laporan.statusPenanganan}</span></p>
          </div>
          {laporan.catatanTambahan && laporan.catatanTambahan !== '-' && (
            <div className="laporan-item">
              <strong>📌 Catatan Tambahan:</strong>
              <p>{laporan.catatanTambahan}</p>
            </div>
          )}
        </div>
      )}

      {(belumValidasi || sudahValidasiBelumSelesai) && (
        <div className="validation-section">
          <div className="validation-title">
            <span
              style={{
                background: 'var(--purple-600)',
                color: 'white',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
              }}
            >
              {sudahValidasiBelumSelesai ? '🔄' : '✅'}
            </span>
            {sudahValidasiBelumSelesai ? 'Ubah Jadwal Konseling' : 'Validasi Jadwal Konseling'}
          </div>
          <div className="validation-field">
            <label htmlFor="validasiTanggal">📅 Tanggal Konseling:</label>
            <input
              type="date"
              id="validasiTanggal"
              value={tanggalValidasi}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setTanggalValidasi(e.target.value)}
            />
          </div>
          <div className="validation-field">
            <label htmlFor="validasiJam">⏰ Jam Konseling:</label>
            <select id="validasiJam" value={jamValidasi} onChange={(e) => setJamValidasi(e.target.value)}>
              <option value="">Pilih jam konseling</option>
              {JAM_LIST.map((jam) => (
                <option value={jam} key={jam}>
                  {jam}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              marginTop: '20px',
              padding: '15px',
              background: 'var(--coral-50)',
              borderRadius: '10px',
              fontSize: '13px',
              color: 'var(--coral-800)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <span>
              <strong>Catatan:</strong>{' '}
              {sudahValidasiBelumSelesai
                ? 'Jika tanggal/jam di atas diubah lalu disimpan, siswa akan menerima notifikasi perubahan jadwal secara otomatis.'
                : 'Jika tidak diubah, jadwal akan menggunakan tanggal dan jam yang diajukan siswa. Konfirmasi perubahan akan terlihat di halaman siswa.'}
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}
