import { useState, useEffect } from 'react';
import ModalKelas from './ModalKelas';
import KelasSelect from '../components/KelasSelect';

const initialForm = { nis: '', nama: '', kelas: '', jenisKelamin: '' };

export default function TambahSiswaModal({ show, onClose, onSave }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (show) setForm(initialForm);
  }, [show]);

  if (!show) return null;

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!form.nis.trim()) { alert('❌ NIS harus diisi!'); return; }
    if (!/^[0-9]+$/.test(form.nis.trim())) { alert('❌ NIS hanya boleh berupa angka!'); return; }
    if (!form.nama.trim()) { alert('❌ Nama harus diisi!'); return; }
    if (!form.kelas) { alert('❌ Kelas harus dipilih!'); return; }

    onSave({
      nis: form.nis.trim(),
      nama: form.nama.trim(),
      kelas: form.kelas,
      jenis_kelamin: form.jenisKelamin,
    });
  }

  return (
    <ModalKelas show={show} onClose={onClose} title="➕ Tambah Siswa Manual" width="480px">
      <div
        style={{
          background: 'var(--blue-50)',
          borderLeft: '4px solid var(--blue-500)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '18px',
          fontSize: '12.5px',
          color: 'var(--blue-700)',
        }}
      >
        ℹ️ Password default akun siswa akan sama dengan NIS-nya. Siswa bisa login lalu menggantinya sendiri.
      </div>
      <div className="add-kelas-form">
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ink-500)', marginBottom: '5px', display: 'block', textTransform: 'uppercase', letterSpacing: '.02em' }}>
            NIS
          </label>
          <input
            type="text"
            placeholder="Nomor Induk Siswa"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ink-200)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
            value={form.nis}
            onChange={(e) => updateField('nis', e.target.value)}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ink-500)', marginBottom: '5px', display: 'block', textTransform: 'uppercase', letterSpacing: '.02em' }}>
            Nama Lengkap
          </label>
          <input
            type="text"
            placeholder="Nama siswa"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ink-200)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
            value={form.nama}
            onChange={(e) => updateField('nama', e.target.value)}
          />
        </div>
        <div className="form-row-kelas">
          <div>
            <label>Kelas</label>
            <KelasSelect value={form.kelas} onChange={(e) => updateField('kelas', e.target.value)} />
          </div>
          <div>
            <label>Jenis Kelamin</label>
            <select value={form.jenisKelamin} onChange={(e) => updateField('jenisKelamin', e.target.value)}>
              <option value="">Pilih</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
        </div>
        <button className="btn-simpan-kelas" onClick={handleSave} style={{ marginTop: '6px' }}>
          💾 Simpan Siswa
        </button>
      </div>
    </ModalKelas>
  );
}
