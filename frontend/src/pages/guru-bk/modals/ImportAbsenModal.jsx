import { useState, useRef, useEffect } from 'react';
import ModalKelas from './ModalKelas';
import { KELAS_OPTIONS } from '../constants';
import { previewImportAbsen, importAbsenRows } from '../api/siswaService';

export default function ImportAbsenModal({ show, onClose, onImported }) {
  const fileRef = useRef(null);
  const [step, setStep] = useState(1);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sections, setSections] = useState(null);
  const [summary, setSummary] = useState('');
  const [mapping, setMapping] = useState({}); // idx -> kelas terpilih
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (show) {
      if (fileRef.current) fileRef.current.value = '';
      setStep(1);
      setSections(null);
      setSummary('');
      setMapping({});
      setResult(null);
    }
  }, [show]);

  if (!show) return null;

  function resetToStep1() {
    setStep(1);
    setSections(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleBaca() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      alert('❌ Pilih file absen terlebih dahulu!');
      return;
    }

    setIsReading(true);
    const res = await previewImportAbsen(file);
    setIsReading(false);

    if (!res.success) {
      alert(`❌ ${res.error}`);
      return;
    }
    if (res.data.sections.length === 0) {
      alert('⚠️ Tidak ada kelas terbaca dari file ini. Pastikan sheet bernama X/XI/XII dan formatnya sesuai.');
      return;
    }

    setSections(res.data.sections);
    setSummary(res.data.message);

    // Auto-map: label absen "KELAS X - 1" -> cocokkan otomatis ke kelas sistem "X - 1"
    const autoMapping = {};
    res.data.sections.forEach((sec, idx) => {
      const grade = sec.sheet;
      const opsiKelas = KELAS_OPTIONS.filter((k) => k.startsWith(`${grade} `));
      const dugaanKelas = sec.label.replace(/^KELAS\s*/i, '').trim();
      if (opsiKelas.includes(dugaanKelas)) {
        autoMapping[idx] = dugaanKelas;
      }
    });
    setMapping(autoMapping);
    setStep(2);
  }

  async function handleSimpan() {
    if (!sections) return;

    const rows = [];
    sections.forEach((sec, idx) => {
      const kelasTerpilih = mapping[idx];
      if (!kelasTerpilih) return;
      sec.siswa.forEach((s) => {
        rows.push({ nis: s.nis, nama: s.nama, kelas: kelasTerpilih, jenis_kelamin: s.jk });
      });
    });

    if (rows.length === 0) {
      alert('❌ Belum ada kelas yang dipetakan. Pilih minimal 1 kelas tujuan.');
      return;
    }

    setIsSaving(true);
    const res = await importAbsenRows(rows);
    setIsSaving(false);

    if (res.success) {
      setResult({ message: res.data.message, skipped: res.data.skipped || [] });
      onImported();
    } else {
      setResult({ isError: true, message: res.error });
    }
  }

  return (
    <ModalKelas show={show} onClose={onClose} title="📋 Import Siswa dari File Absen" width="760px">
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
        💡 Upload file "Daftar Hadir Peserta Didik" (harus punya sheet bernama persis <strong>X</strong>,{' '}
        <strong>XI</strong>, dan/atau <strong>XII</strong>). Karena format kelas sistem sekarang sama persis
        dengan di absen (mis. "X - 1"), tiap kelas akan otomatis terisi cocok — kamu tinggal cek lalu klik Import.
      </div>

      {step === 1 && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--ink-500)',
                marginBottom: '6px',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '.02em',
              }}
            >
              Pilih File Absen (.xlsx / .xls)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fileRef}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ink-200)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
            />
          </div>
          <button className="btn-simpan-kelas" onClick={handleBaca} disabled={isReading}>
            {isReading ? '⏳ Membaca file...' : '🔍 Baca File'}
          </button>
        </div>
      )}

      {step === 2 && sections && (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--ink-800)', marginBottom: '14px' }}>{summary}</div>
          <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
            <table className="riwayat-kelas-table" style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th>Kelas di Absen</th>
                  <th>Jumlah Siswa</th>
                  <th>Petakan ke Kelas Sistem</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((sec, idx) => {
                  const grade = sec.sheet;
                  const opsiKelas = KELAS_OPTIONS.filter((k) => k.startsWith(`${grade} `));
                  return (
                    <tr key={idx}>
                      <td><span className="badge-tahun">{sec.label}</span></td>
                      <td>{sec.siswa.length} siswa</td>
                      <td>
                        <select
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--ink-200)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                          value={mapping[idx] || ''}
                          onChange={(e) => setMapping((prev) => ({ ...prev, [idx]: e.target.value }))}
                        >
                          <option value="">— Lewati kelas ini —</option>
                          {opsiKelas.map((k) => (
                            <option value={k} key={k}>
                              {k}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {result && (
            <div
              style={{
                background: 'var(--ink-50)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                fontSize: '12.5px',
                color: 'var(--ink-700)',
                marginBottom: '16px',
                maxHeight: '220px',
                overflowY: 'auto',
              }}
            >
              {result.isError ? (
                <span style={{ color: 'var(--red-700)' }}>❌ {result.message}</span>
              ) : (
                <>
                  <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--ink-800)' }}>{result.message}</div>
                  {result.skipped?.length > 0 && (
                    <>
                      <div style={{ fontWeight: 700, color: 'var(--red-700)', marginBottom: '4px' }}>Baris dilewati:</div>
                      <ul style={{ margin: 0, paddingLeft: '18px' }}>
                        {result.skipped.map((s, i) => (
                          <li key={i}>{s.reason}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-simpan-kelas" onClick={handleSimpan} disabled={isSaving}>
              {isSaving ? '⏳ Menyimpan...' : '💾 Import Sekarang'}
            </button>
            <button className="btn-cancel" style={{ flex: '0 0 auto', padding: '11px 20px' }} onClick={resetToStep1}>
              🔄 Pilih File Lain
            </button>
          </div>
        </div>
      )}
    </ModalKelas>
  );
}
