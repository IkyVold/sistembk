import { useState, useRef, useEffect } from 'react';
import ModalKelas from './ModalKelas';
import { importSiswaExcel } from '../api/siswaService';

export default function ImportSiswaModal({ show, onClose, onImported }) {
  const fileRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null); // { message, skipped, isError }

  useEffect(() => {
    if (show) {
      if (fileRef.current) fileRef.current.value = '';
      setResult(null);
    }
  }, [show]);

  if (!show) return null;

  async function handleProses() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      alert('❌ Pilih file Excel terlebih dahulu!');
      return;
    }

    setIsProcessing(true);
    const res = await importSiswaExcel(file);
    setIsProcessing(false);

    if (res.success) {
      setResult({ message: res.data.message, skipped: res.data.skipped || [] });
      onImported();
    } else {
      setResult({ isError: true, message: res.error });
    }
  }

  return (
    <ModalKelas show={show} onClose={onClose} title="📥 Import Siswa dari Excel" width="520px">
      <div
        style={{
          background: 'var(--amber-50)',
          borderLeft: '4px solid var(--amber-500)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '18px',
          fontSize: '12.5px',
          color: 'var(--amber-700)',
        }}
      >
        💡 File harus punya kolom header: <strong>NIS</strong>, <strong>Nama</strong>, <strong>Kelas</strong>,{' '}
        <strong>Jenis Kelamin</strong> (kolom Jenis Kelamin opsional). Format kelas harus persis seperti "X - 1".
        NIS yang sudah terdaftar akan <strong>diperbarui</strong> datanya, bukan ditolak. Password default siswa
        baru = NIS-nya.
      </div>
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
          Pilih File (.xlsx / .xls)
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          ref={fileRef}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ink-200)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
        />
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
                      <li key={i}>Baris {s.row}: {s.reason}</li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      )}
      <button className="btn-simpan-kelas" onClick={handleProses} disabled={isProcessing}>
        {isProcessing ? '⏳ Memproses...' : '📥 Proses Import'}
      </button>
    </ModalKelas>
  );
}
