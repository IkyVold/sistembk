import { useState, useEffect } from 'react';
import ModalKelas from './ModalKelas';
import { KATEGORI_INFORMASI_LIST } from '../constants';

const fieldLabelStyle = {
  fontSize: '11.5px',
  fontWeight: 700,
  color: 'var(--ink-500)',
  marginBottom: '5px',
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '.02em',
};
const fieldInputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--ink-200)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '13px',
};

export default function InformasiModal({ show, editing, onClose, onSave }) {
  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState('Beasiswa');
  const [isi, setIsi] = useState('');

  useEffect(() => {
    if (!show) return;
    if (editing) {
      setJudul(editing.judul);
      setKategori(editing.kategori);
      setIsi(editing.isi);
    } else {
      setJudul('');
      setKategori('Beasiswa');
      setIsi('');
    }
  }, [show, editing]);

  if (!show) return null;

  function handleSave() {
    if (!judul.trim()) { alert('❌ Judul harus diisi!'); return; }
    if (!isi.trim()) { alert('❌ Isi informasi harus diisi!'); return; }
    onSave({ id: editing?.id, judul: judul.trim(), kategori, isi: isi.trim() });
  }

  return (
    <ModalKelas
      show={show}
      onClose={onClose}
      title={editing ? '✏️ Edit Informasi' : '➕ Tambah Informasi'}
      width="560px"
    >
      <div className="add-kelas-form">
        <div style={{ marginBottom: '12px' }}>
          <label style={fieldLabelStyle}>Judul</label>
          <input
            type="text"
            placeholder="Contoh: Beasiswa Bidikmisi 2026"
            style={fieldInputStyle}
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={fieldLabelStyle}>Kategori</label>
          <select style={fieldInputStyle} value={kategori} onChange={(e) => setKategori(e.target.value)}>
            {KATEGORI_INFORMASI_LIST.map((k) => (
              <option value={k} key={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={fieldLabelStyle}>Isi Informasi</label>
          <textarea
            rows={7}
            placeholder="Tulis detail lengkap — syarat, jadwal, kuota, link pendaftaran, dsb. Chatbot akan menjawab persis berdasarkan isi ini."
            style={{ ...fieldInputStyle, fontFamily: 'inherit', resize: 'vertical' }}
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
          />
        </div>
        <button className="btn-simpan-kelas" onClick={handleSave}>
          💾 Simpan Informasi
        </button>
      </div>
    </ModalKelas>
  );
}
