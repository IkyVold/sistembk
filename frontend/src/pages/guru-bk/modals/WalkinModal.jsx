import { useState, useEffect } from 'react';
import Modal from './Modal';
import KelasSelect from '../components/KelasSelect';
import { JAM_LIST, KATEGORI_MASALAH_LIST } from '../constants';
import { lookupSiswaByNis } from '../api/konselingService';

function closestJam() {
  const now = new Date();
  const nowH = now.getHours();
  const nowM = now.getMinutes() >= 30 ? 30 : 0;
  const nowStr = `${String(nowH).padStart(2, '0')}:${String(nowM).padStart(2, '0')}`;
  return JAM_LIST.includes(nowStr) ? nowStr : '';
}

const initialForm = {
  nis: '',
  nama: '',
  kelas: '',
  tanggal: new Date().toISOString().split('T')[0],
  jam: closestJam(),
  jenis: 'Tatap Muka',
  kategori: '',
  deskripsi: '',
  catatan: '',
  langsungLaporan: false,
};

export default function WalkinModal({ show, onClose, onSave }) {
  const [form, setForm] = useState(initialForm);
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    if (show) {
      setForm({ ...initialForm, tanggal: new Date().toISOString().split('T')[0], jam: closestJam() });
    }
  }, [show]);

  if (!show) return null;

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleNisBlur() {
    const nis = form.nis.trim();
    if (!nis) {
      updateField('nama', '');
      updateField('kelas', '');
      return;
    }
    setIsLookingUp(true);
    updateField('nama', 'Mencari...');
    try {
      const siswa = await lookupSiswaByNis(nis);
      updateField('nama', siswa.nama || '');
      updateField('kelas', siswa.kelas || '');
    } catch {
      updateField('nama', '');
      updateField('kelas', '');
      alert(`❌ Siswa dengan NIS "${nis}" tidak ditemukan. Walk-in memakai akun siswa yang sudah terdaftar.`);
    } finally {
      setIsLookingUp(false);
    }
  }

  function handleSubmit() {
    const nis = form.nis.trim();
    if (!nis) { alert('❌ NIS siswa harus diisi!'); return; }
    if (!/^[0-9]+$/.test(nis)) { alert('❌ NIS hanya boleh berupa angka!'); return; }
    if (!form.tanggal) { alert('❌ Tanggal konseling harus diisi!'); return; }
    if (!form.jam) { alert('❌ Jam konseling harus dipilih!'); return; }
    if (!form.kategori) { alert('❌ Kategori masalah harus dipilih!'); return; }
    if (!form.deskripsi.trim()) { alert('❌ Deskripsi / kronologi masalah harus diisi!'); return; }

    onSave({
      nis,
      tanggal: form.tanggal,
      jam: form.jam,
      jenis: form.jenis,
      kategori: form.kategori,
      deskripsi: form.deskripsi.trim(),
      catatan: form.catatan.trim(),
      langsungLaporan: form.langsungLaporan,
    });
  }

  const footer = (
    <>
      <button className="btn btn-batal" onClick={onClose}>
        Batal
      </button>
      <button className="btn btn-selesai" onClick={handleSubmit}>
        💾 Simpan Data Konseling
      </button>
    </>
  );

  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal
      show={show}
      onClose={onClose}
      title="➕ Input Konseling Manual (Walk-in)"
      headerStyle={{ background: 'linear-gradient(120deg, var(--green-700) 0%, var(--green-500) 100%)' }}
      footer={footer}
    >
      <div
        style={{
          background: 'var(--amber-50)',
          borderLeft: '4px solid var(--amber-500)',
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontSize: '13px',
          color: 'var(--amber-700)',
          display: 'flex',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '18px' }}>💡</span>
        <span>
          Gunakan form ini untuk siswa yang datang/dibawa langsung ke ruang BK <strong>tanpa mengajukan jadwal
          lebih dulu</strong> (misalnya ditemukan menangis di kelas/kamar mandi). Data akan otomatis tercatat
          sebagai <strong>Terkonfirmasi</strong> karena sesi sudah berlangsung.
        </span>
      </div>

      <div className="validation-section" style={{ marginTop: 0 }}>
        <div className="validation-title">
          <span>👤</span> Data Siswa
        </div>
        <div
          style={{
            background: 'var(--blue-50)',
            borderLeft: '4px solid var(--blue-500)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '14px',
            fontSize: '12.5px',
            color: 'var(--blue-700)',
          }}
        >
          ℹ️ Masukkan NIS siswa yang <strong>sudah punya akun</strong> — nama dan kelas akan terisi otomatis dari
          data siswa.
        </div>
        <div className="validation-field">
          <label htmlFor="walkinNis">NIS Siswa:</label>
          <input
            type="text"
            id="walkinNis"
            placeholder="Nomor Induk Siswa"
            value={form.nis}
            onChange={(e) => updateField('nis', e.target.value)}
            onBlur={handleNisBlur}
          />
        </div>
        <div className="validation-field">
          <label htmlFor="walkinNama">Nama Siswa:</label>
          <input
            type="text"
            id="walkinNama"
            placeholder="Terisi otomatis setelah NIS diketik"
            readOnly
            value={form.nama}
            style={{ background: 'var(--ink-50)', color: 'var(--ink-500)' }}
          />
        </div>
        <div className="validation-field">
          <label htmlFor="walkinKelas">Kelas:</label>
          <KelasSelect id="walkinKelas" value={form.kelas} onChange={() => {}} disabled />
        </div>

        <div className="validation-title" style={{ marginTop: '20px' }}>
          <span>📅</span> Detail Sesi Konseling
        </div>
        <div className="validation-field">
          <label htmlFor="walkinTanggal">Tanggal Konseling:</label>
          <input
            type="date"
            id="walkinTanggal"
            value={form.tanggal}
            max={today}
            onChange={(e) => updateField('tanggal', e.target.value)}
          />
        </div>
        <div className="validation-field">
          <label htmlFor="walkinJam">Jam Konseling:</label>
          <select id="walkinJam" value={form.jam} onChange={(e) => updateField('jam', e.target.value)}>
            <option value="">Pilih jam konseling</option>
            {JAM_LIST.map((jam) => (
              <option value={jam} key={jam}>
                {jam}
              </option>
            ))}
          </select>
        </div>
        <div className="validation-field">
          <label htmlFor="walkinJenis">Jenis Konseling:</label>
          <select id="walkinJenis" value={form.jenis} onChange={(e) => updateField('jenis', e.target.value)}>
            <option value="Tatap Muka">🏫 Tatap Muka</option>
            <option value="Daring">🌐 Daring</option>
          </select>
        </div>
        <div className="validation-field">
          <label htmlFor="walkinKategori">Kategori Masalah:</label>
          <select id="walkinKategori" value={form.kategori} onChange={(e) => updateField('kategori', e.target.value)}>
            <option value="">Pilih kategori masalah</option>
            {KATEGORI_MASALAH_LIST.map((kategori) => (
              <option value={kategori} key={kategori}>
                {kategori}
              </option>
            ))}
          </select>
        </div>
        <div className="validation-field">
          <label htmlFor="walkinDeskripsi">Deskripsi / Kronologi Masalah:</label>
          <textarea
            id="walkinDeskripsi"
            rows={4}
            placeholder="Ceritakan kronologi singkat kejadian, kondisi siswa saat ditemukan, dsb..."
            value={form.deskripsi}
            onChange={(e) => updateField('deskripsi', e.target.value)}
          />
        </div>
        <div className="validation-field">
          <label htmlFor="walkinCatatan">Catatan Tambahan (opsional):</label>
          <textarea
            id="walkinCatatan"
            rows={2}
            placeholder="Informasi tambahan, misalnya siapa yang menemukan/melapor..."
            value={form.catatan}
            onChange={(e) => updateField('catatan', e.target.value)}
          />
        </div>
        <div className="validation-field">
          <label htmlFor="walkinLangsungLaporan">&nbsp;</label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              color: 'var(--ink-700)',
              paddingTop: 0,
              width: 'auto',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              id="walkinLangsungLaporan"
              style={{ flex: '0 0 auto', width: '16px', height: '16px' }}
              checked={form.langsungLaporan}
              onChange={(e) => updateField('langsungLaporan', e.target.checked)}
            />
            Lanjutkan langsung ke form Laporan Hasil Konseling setelah data disimpan
          </label>
        </div>
      </div>
    </Modal>
  );
}
