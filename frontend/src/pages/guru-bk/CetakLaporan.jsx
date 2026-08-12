import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HARI_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function parseDate(raw) {
  if (!raw) return null;
  try {
    // YYYY-MM-DD or already formatted
    if (String(raw).includes('-') && String(raw).length >= 8) {
      const [y, m, d] = String(raw).split(/[-T]/);
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      if (!Number.isNaN(dt.getTime())) return dt;
    }
    const dt = new Date(raw);
    if (!Number.isNaN(dt.getTime())) return dt;
  } catch {
    /* ignore */
  }
  return null;
}

function formatHariTanggal(raw, fallback) {
  const dt = parseDate(raw);
  if (!dt) return fallback || '-';
  const hari = HARI_NAMES[dt.getDay()];
  const tgl = dt.getDate();
  const bln = BULAN_NAMES[dt.getMonth()];
  const thn = dt.getFullYear();
  return `${hari}, ${tgl} ${bln} ${thn}`;
}

function getTahunPelajaran(dt) {
  if (!dt) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const start = m >= 7 ? y : y - 1;
    return `${start} - ${start + 1}`;
  }
  const y = dt.getFullYear();
  const m = dt.getMonth() + 1;
  const start = m >= 7 ? y : y - 1;
  return `${start} - ${start + 1}`;
}

function getSemester(dt) {
  if (!dt) {
    const m = new Date().getMonth() + 1;
    return m >= 7 && m <= 12 ? 'GANJIL' : 'GENAP';
  }
  const m = dt.getMonth() + 1;
  return m >= 7 && m <= 12 ? 'GANJIL' : 'GENAP';
}

function getBulanLabel(dt) {
  if (!dt) return BULAN_NAMES[new Date().getMonth()];
  return BULAN_NAMES[dt.getMonth()];
}

/** Minggu ke berapa dalam bulan (1-based, berdasarkan minggu kalender) */
function getMingguKe(dt) {
  if (!dt) return 1;
  const day = dt.getDate();
  return Math.ceil(day / 7);
}

/** Map kategori app → jenis bimbingan seperti di jurnal resmi */
function mapJenisBimbingan(kategori, deskripsi) {
  const k = (kategori || '').toLowerCase();
  const d = (deskripsi || '').toLowerCase();
  if (k.includes('akademik') || d.includes('belajar') || d.includes('mapel') || d.includes('kbm')) {
    return 'Pribadi dan Belajar';
  }
  if (k.includes('karir') || d.includes('kuliah') || d.includes('jurusan') || d.includes('karir')) {
    return 'Pribadi dan Karir';
  }
  if (k.includes('keluarga') || k.includes('pribadi') || k.includes('emosional') || k.includes('pertemanan')) {
    return 'Pribadi';
  }
  if (k.includes('bullying') || k.includes('sosial')) {
    return 'Pribadi dan Sosial';
  }
  return kategori || 'Pribadi';
}

function mapMateriLayanan(item) {
  // Prefer kesimpulan laporan, fallback deskripsi
  if (item.laporanGuru?.kesimpulan) return item.laporanGuru.kesimpulan;
  if (item.deskripsi && item.deskripsi !== 'Tidak ada deskripsi masalah') return item.deskripsi;
  return '-';
}

function mapTindakLanjut(item) {
  if (item.laporanGuru?.rekomendasi) return item.laporanGuru.rekomendasi;
  return '';
}

export default function CetakLaporan() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({
    guruName: '',
    sekolahName: '',
    sekolahAlamat: '',
    sekolahTelp: '',
    kepalaSekolah: '',
    kepalaSekolahNip: '',
    filter: 'all',
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('laporanKonseling');
      const parsed = raw ? JSON.parse(raw) : [];
      setData(Array.isArray(parsed) ? parsed : []);
      setMeta({
        guruName: localStorage.getItem('guruName') || 'Guru BK',
        sekolahName: localStorage.getItem('sekolahName') || 'SMA Negeri Darussholah Singojuruh',
        sekolahAlamat:
          localStorage.getItem('sekolahAlamat') ||
          'Jl. Aruji Karta Winata, No. 39 Gumirih Kec. Singojuruh - Banyuwangi',
        sekolahTelp: localStorage.getItem('sekolahTelp') || 'Telp. 0333 - 635381',
        kepalaSekolah: localStorage.getItem('kepalaSekolah') || 'WAHYU WINDARI, M.Pd.',
        kepalaSekolahNip: localStorage.getItem('kepalaSekolahNip') || 'NIP. 19730317 199903 2 007',
        filter: localStorage.getItem('laporanFilter') || 'all',
      });
    } catch (e) {
      console.error('Gagal membaca data laporan:', e);
      setData([]);
    } finally {
      setReady(true);
    }
  }, []);

  // Urutkan berdasarkan tanggal
  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const da = parseDate(a.tanggalRaw || a.tanggal)?.getTime() || 0;
      const db = parseDate(b.tanggalRaw || b.tanggal)?.getTime() || 0;
      return da - db;
    });
  }, [data]);

  const refDate = useMemo(() => {
    if (sorted.length === 0) return new Date();
    return parseDate(sorted[0].tanggalRaw || sorted[0].tanggal) || new Date();
  }, [sorted]);

  const tahunPelajaran = getTahunPelajaran(refDate);
  const semester = getSemester(refDate);
  const bulanLabel = getBulanLabel(refDate);
  const mingguKe = getMingguKe(refDate);

  // Tanggal tanda tangan (hari ini)
  const ttdDate = useMemo(() => {
    const now = new Date();
    return `${now.getDate()} ${BULAN_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  function handlePrint() {
    window.print();
  }

  function handleBack() {
    navigate('/guru-bk');
  }

  if (!ready) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'Segoe UI, sans-serif' }}>
        Memuat data laporan...
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          fontFamily: 'Segoe UI, sans-serif',
          color: '#444',
        }}
      >
        <h2>Tidak ada data untuk dicetak</h2>
        <p style={{ color: '#888' }}>Kembali ke dashboard dan pilih data konseling terlebih dahulu.</p>
        <button
          type="button"
          onClick={handleBack}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#0d9488',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #e5e7eb;
          font-family: 'Times New Roman', Times, serif;
        }
        .toolbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #1e293b;
          color: #fff;
          padding: 12px 20px;
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .toolbar button {
          padding: 10px 18px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: 'Segoe UI', sans-serif;
        }
        .btn-print {
          background: #16a34a;
          color: #fff;
        }
        .btn-print:hover { background: #15803d; }
        .btn-back {
          background: #64748b;
          color: #fff;
        }
        .btn-back:hover { background: #475569; }
        .page {
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          background: #fff;
          padding: 18mm 14mm 16mm;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          color: #000;
        }
        .header-title {
          text-align: center;
          margin-bottom: 6px;
        }
        .header-title h1 {
          margin: 0;
          font-size: 15pt;
          font-weight: bold;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          line-height: 1.35;
        }
        .header-title h2 {
          margin: 2px 0 0;
          font-size: 13pt;
          font-weight: bold;
          text-transform: uppercase;
        }
        .header-title h3 {
          margin: 2px 0 0;
          font-size: 12pt;
          font-weight: bold;
          text-transform: uppercase;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          margin: 16px 0 10px;
          font-size: 11pt;
          font-weight: bold;
        }
        table.jurnal {
          width: 100%;
          border-collapse: collapse;
          font-size: 10pt;
          table-layout: fixed;
        }
        table.jurnal th,
        table.jurnal td {
          border: 1px solid #000;
          padding: 6px 5px;
          vertical-align: top;
          word-wrap: break-word;
        }
        table.jurnal th {
          background: #f3f4f6;
          text-align: center;
          font-weight: bold;
          font-size: 9.5pt;
          text-transform: uppercase;
        }
        table.jurnal td.no { text-align: center; width: 28px; }
        table.jurnal td.nama { width: 90px; }
        table.jurnal td.kelas { text-align: center; width: 70px; }
        table.jurnal td.hari { width: 95px; }
        table.jurnal td.jenis { width: 85px; }
        table.jurnal td.materi { width: auto; }
        table.jurnal td.tindak { width: 90px; }
        .footer-sign {
          display: flex;
          justify-content: space-between;
          margin-top: 28px;
          font-size: 11pt;
          page-break-inside: avoid;
        }
        .sign-box {
          width: 42%;
          text-align: center;
        }
        .sign-box .label {
          margin-bottom: 4px;
        }
        .sign-box .jabatan {
          font-weight: normal;
        }
        .sign-space {
          height: 70px;
        }
        .sign-name {
          font-weight: bold;
          text-decoration: underline;
          margin-top: 4px;
        }
        .sign-nip {
          font-size: 10pt;
        }
        .sign-right .tempat {
          margin-bottom: 2px;
        }
        @media print {
          body { background: #fff; }
          .toolbar { display: none !important; }
          .page {
            width: 100%;
            min-height: auto;
            margin: 0;
            padding: 10mm 8mm;
            box-shadow: none;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="toolbar">
        <button type="button" className="btn-back" onClick={handleBack}>
          ← Kembali
        </button>
        <button type="button" className="btn-print" onClick={handlePrint}>
          🖨️ Cetak / Simpan PDF
        </button>
        <span style={{ fontSize: 13, opacity: 0.85, fontFamily: 'Segoe UI, sans-serif' }}>
          {sorted.length} data konseling · Gunakan dialog cetak browser → &quot;Save as PDF&quot;
        </span>
      </div>

      <div className="page">
        <div className="header-title">
          <h1>JURNAL KERJA GURU BIMBINGAN DAN KONSELING</h1>
          <h2>TAHUN PELAJARAN {tahunPelajaran}</h2>
          <h3>SEMESTER {semester}</h3>
        </div>

        <div className="meta-row">
          <div>BULAN : {bulanLabel}</div>
          <div>MINGGU KE : {mingguKe}</div>
        </div>

        <table className="jurnal">
          <thead>
            <tr>
              <th style={{ width: '28px' }}>NO</th>
              <th style={{ width: '90px' }}>NAMA SISWA</th>
              <th style={{ width: '70px' }}>KELAS</th>
              <th style={{ width: '95px' }}>HARI/TANGGAL</th>
              <th style={{ width: '85px' }}>JENIS BIMBINGAN</th>
              <th>MATERI LAYANAN</th>
              <th style={{ width: '90px' }}>TINDAK LANJUT</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="no">{idx + 1}</td>
                <td className="nama">{item.namaSiswa || '-'}</td>
                <td className="kelas">{item.kelasSiswa || '-'}</td>
                <td className="hari">
                  {formatHariTanggal(item.tanggalRaw || item.tanggal, item.tanggal)}
                </td>
                <td className="jenis">
                  {mapJenisBimbingan(item.kategori, item.deskripsi)}
                </td>
                <td className="materi">{mapMateriLayanan(item)}</td>
                <td className="tindak">{mapTindakLanjut(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="footer-sign">
          <div className="sign-box sign-left">
            <div className="label">Mengetahui,</div>
            <div className="jabatan">Kepala Sekolah</div>
            <div className="sign-space" />
            <div className="sign-name">{meta.kepalaSekolah}</div>
            <div className="sign-nip">{meta.kepalaSekolahNip}</div>
          </div>
          <div className="sign-box sign-right">
            <div className="tempat">Banyuwangi, {ttdDate}</div>
            <div className="jabatan">Guru BK</div>
            <div className="sign-space" />
            <div className="sign-name">{meta.guruName}</div>
          </div>
        </div>
      </div>
    </>
  );
}
