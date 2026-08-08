import { useState, useEffect, useCallback } from 'react';
import ModalKelas from './ModalKelas';
import KelasSelect from '../components/KelasSelect';
import { fetchRiwayatKelas, simpanRiwayatKelas, hapusRiwayatKelas } from '../api/riwayatKelasService';

export default function RiwayatKelasModal({ siswa, onClose, onKelasAktifBerubah }) {
  const [riwayat, setRiwayat] = useState(null); // null = loading, [] = empty, error handled inline
  const [loadError, setLoadError] = useState(false);
  const [tahunAjaran, setTahunAjaran] = useState('');
  const [kelas, setKelas] = useState('');
  const [status, setStatus] = useState('aktif');

  const load = useCallback(async (nis) => {
    setRiwayat(null);
    setLoadError(false);
    try {
      const data = await fetchRiwayatKelas(nis);
      setRiwayat(data);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    if (siswa) {
      setTahunAjaran('');
      setKelas('');
      setStatus('aktif');
      load(siswa.nis);
    }
  }, [siswa, load]);

  if (!siswa) return null;

  async function handleSimpan() {
    const tahun = tahunAjaran.trim();
    if (!tahun || !kelas) {
      alert('Harap isi tahun ajaran dan kelas terlebih dahulu!');
      return;
    }
    if (!/^\d{4}\/\d{4}$/.test(tahun)) {
      alert('Format tahun ajaran harus seperti: 2024/2025');
      return;
    }

    const res = await simpanRiwayatKelas({ nis: siswa.nis, tahun_ajaran: tahun, kelas, status });
    if (res.success) {
      alert('✅ Riwayat kelas berhasil disimpan!');
      await load(siswa.nis);
      if (status === 'aktif') {
        onKelasAktifBerubah(siswa.nis, kelas);
      }
      setTahunAjaran('');
      setKelas('');
    } else {
      alert(`❌ ${res.error}`);
    }
  }

  async function handleHapus(id) {
    if (!confirm('Hapus riwayat kelas ini?')) return;
    const res = await hapusRiwayatKelas(id);
    if (res.success) {
      await load(siswa.nis);
    } else {
      alert(`❌ ${res.error}`);
    }
  }

  return (
    <ModalKelas show={Boolean(siswa)} onClose={onClose} title={`📚 Riwayat Kelas — ${siswa.nama}`}>
      <div style={{ background: 'var(--purple-50)', borderRadius: '10px', padding: '12px 16px', marginBottom: '18px', fontSize: '13px', color: 'var(--gray-600)' }}>
        <strong>NIS:</strong> {siswa.nis} &nbsp;|&nbsp; <strong>Nama:</strong> {siswa.nama}
      </div>

      <div>
        {riwayat === null && !loadError && (
          <p style={{ color: 'var(--gray-600)', fontSize: '13px', textAlign: 'center', padding: '10px' }}>
            ⏳ Memuat riwayat kelas...
          </p>
        )}
        {loadError && (
          <p style={{ color: 'var(--red-600)', fontSize: '13px', textAlign: 'center', padding: '10px' }}>
            ❌ Gagal memuat riwayat kelas. Pastikan server berjalan.
          </p>
        )}
        {riwayat && riwayat.length === 0 && (
          <p style={{ color: 'var(--gray-600)', fontSize: '13px', textAlign: 'center', padding: '12px', background: 'var(--gray-50)', borderRadius: '8px', marginBottom: '16px' }}>
            Belum ada riwayat kelas. Tambahkan di bawah.
          </p>
        )}
        {riwayat && riwayat.length > 0 && (
          <table className="riwayat-kelas-table">
            <thead>
              <tr>
                <th>Tahun Ajaran</th>
                <th>Kelas</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.map((row) => {
                const isAktif = row.status === 'aktif';
                return (
                  <tr key={row.id}>
                    <td><span className="badge-tahun">{row.tahun_ajaran}</span></td>
                    <td>
                      <span className="badge-kelas-aktif" style={isAktif ? undefined : { background: 'var(--gray-50)', color: 'var(--gray-600)' }}>
                        {row.kelas}
                      </span>
                    </td>
                    <td>
                      {isAktif ? (
                        <span style={{ color: 'var(--teal-400)', fontWeight: 700, fontSize: '12px' }}>● Aktif</span>
                      ) : (
                        <span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>Arsip</span>
                      )}
                    </td>
                    <td>
                      <button className="btn-hapus-riwayat" onClick={() => handleHapus(row.id)} title="Hapus">
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="add-kelas-form">
        <h4>➕ Tambah / Perbarui Kelas</h4>
        <div className="form-row-kelas">
          <div>
            <label>Tahun Ajaran</label>
            <input
              type="text"
              placeholder="cth: 2024/2025"
              maxLength={9}
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
            />
          </div>
          <div>
            <label>Kelas</label>
            <KelasSelect value={kelas} onChange={(e) => setKelas(e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-600)', marginBottom: '4px', display: 'block' }}>
            Status
          </label>
          <select
            style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--gray-100)', borderRadius: '8px', fontSize: '13px' }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="aktif">Aktif (kelas sekarang)</option>
            <option value="arsip">Arsip (sudah lewat)</option>
          </select>
        </div>
        <button className="btn-simpan-kelas" onClick={handleSimpan}>
          💾 Simpan Riwayat Kelas
        </button>
      </div>
    </ModalKelas>
  );
}
