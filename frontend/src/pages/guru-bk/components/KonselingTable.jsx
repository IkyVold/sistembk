import { LAPORAN_EDIT_WINDOW_HOURS } from '../constants';
import { sisaWaktuEditText } from '../helpers';

function truncate(text, max = 100) {
  const value = text || 'Tidak ada deskripsi';
  return value.length > max ? `${value.substring(0, max)}...` : value;
}

export default function KonselingTable({
  data,
  emptyMessage,
  onDetail,
  onValidasi,
  onLaporan,
  onBatal,
  onChat,
  onLihatLaporan,
  onEditLaporan,
}) {
  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-600)' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>📋</div>
        <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px', color: 'var(--gray-800)' }}>
          Tidak ada data konseling
        </div>
        <div style={{ fontSize: '15px', color: 'var(--gray-600)' }}>{emptyMessage}</div>
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            background: 'var(--purple-50)',
            borderRadius: '12px',
            display: 'inline-block',
          }}
        >
          <span style={{ color: 'var(--purple-600)' }}>⏳ Data akan muncul ketika siswa memilih Anda sebagai guru BK</span>
        </div>
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>No</th>
          <th>Siswa</th>
          <th>NIS</th>
          <th>Kelas</th>
          <th>Tahun Ajaran</th>
          <th>Tanggal Diajukan</th>
          <th>Jam</th>
          <th>Tanggal Validasi</th>
          <th>Jam Validasi</th>
          <th>Jenis</th>
          <th>Kategori</th>
          <th style={{ minWidth: '250px' }}>Deskripsi Masalah</th>
          <th>Status Validasi</th>
          <th>Status</th>
          <th>Laporan</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => {
          const statusValidasiClass = item.statusValidasi === 'Tervalidasi' ? 'status-selesai' : 'status-proses';
          let statusClass = 'status-proses';
          if (item.status === 'Selesai') statusClass = 'status-selesai';
          else if (item.status === 'Dibatalkan') statusClass = 'status-dibatalkan';

          const isOnline = item.jenis === 'Daring' && item.statusValidasi === 'Tervalidasi';
          const hasLaporan = Boolean(item.laporanGuru);
          const belumValidasi = item.statusValidasi !== 'Tervalidasi' && item.status === 'Proses';
          const sudahValidasiBelumSelesai = item.statusValidasi === 'Tervalidasi' && item.status === 'Proses';

          return (
            <tr key={item.id}>
              <td style={{ fontWeight: 600 }}>{index + 1}</td>
              <td>
                <strong>{item.namaSiswa}</strong>
                {item.inputManual && (
                  <>
                    <br />
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '3px',
                        padding: '2px 8px',
                        background: 'var(--green-100)',
                        color: 'var(--green-700)',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: 700,
                      }}
                    >
                      ✍️ Walk-in
                    </span>
                  </>
                )}
              </td>
              <td>{item.nisnSiswa || '-'}</td>
              <td>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    background: 'var(--purple-50)',
                    color: 'var(--purple-800)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {item.kelasSiswa || '-'}
                </span>
              </td>
              <td>
                <span
                  style={{
                    fontSize: '11px',
                    background: 'var(--coral-50)',
                    color: 'var(--coral-800)',
                    padding: '3px 8px',
                    borderRadius: '10px',
                    fontWeight: 600,
                  }}
                >
                  {item.tahunAjaran || '-'}
                </span>
              </td>
              <td>{item.tanggal || '-'}</td>
              <td>{item.jam || '-'}</td>
              <td>{item.tanggalValidasi || '-'}</td>
              <td>{item.jamValidasi || '-'}</td>
              <td>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    background: 'var(--gray-100)',
                    borderRadius: '20px',
                    fontSize: '12px',
                  }}
                >
                  {item.jenis === 'Daring' ? '🌐' : '🏫'} {item.jenis || '-'}
                </span>
              </td>
              <td>{item.kategori || '-'}</td>
              <td>
                <div className="deskripsi-singkat" title={item.deskripsi || 'Tidak ada deskripsi'}>
                  {truncate(item.deskripsi)}
                </div>
              </td>
              <td>
                <span className={`status-badge ${statusValidasiClass}`}>
                  {item.statusValidasi || 'Belum Divalidasi'}
                </span>
              </td>
              <td>
                <span className={`status-badge ${statusClass}`}>{item.status || 'Proses'}</span>
              </td>
              <td>
                {hasLaporan ? (
                  <span className="status-badge status-selesai" style={{ background: 'var(--teal-50)' }}>
                    ✅ Ada
                  </span>
                ) : (
                  <span className="status-badge status-proses">❌ Belum</span>
                )}
              </td>
              <td>
                <div className="action-buttons">
                  <button className="btn btn-detail" onClick={() => onDetail(item.id)}>
                    <span>📋</span> Detail
                  </button>
                  {belumValidasi && (
                    <button className="btn btn-validasi" onClick={() => onValidasi(item.id)}>
                      <span>✅</span> Validasi
                    </button>
                  )}
                  {sudahValidasiBelumSelesai && (
                    <button className="btn btn-laporan" onClick={() => onLaporan(item.id)}>
                      <span>📝</span> Buat Laporan
                    </button>
                  )}
                  {(belumValidasi || sudahValidasiBelumSelesai) && (
                    <button className="btn btn-batal" onClick={() => onBatal(item.id)}>
                      <span>❌</span> Batal
                    </button>
                  )}
                  {isOnline && (
                    <button className="btn btn-chat" onClick={() => onChat(item.id)}>
                      <span>💬</span> Chat
                    </button>
                  )}
                  {item.status === 'Selesai' && item.laporanGuru && (
                    <>
                      <button className="btn btn-detail" onClick={() => onLihatLaporan(item.id)}>
                        <span>📄</span> Lihat Laporan
                      </button>
                      {item.canEditLaporan ? (
                        <button
                          className="btn btn-laporan"
                          onClick={() => onEditLaporan(item.id)}
                          title={sisaWaktuEditText(item.laporanCreatedAt)}
                        >
                          <span>✏️</span> Edit Laporan
                        </button>
                      ) : (
                        <span
                          className="btn"
                          style={{ background: 'var(--ink-100)', color: 'var(--ink-400)', cursor: 'not-allowed' }}
                          title={`Sudah lewat ${LAPORAN_EDIT_WINDOW_HOURS} jam sejak disimpan`}
                        >
                          <span>🔒</span> Terkunci
                        </span>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
