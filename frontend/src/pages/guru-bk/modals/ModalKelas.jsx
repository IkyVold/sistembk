// Modal gaya "kelas" (dipakai untuk modal informasi, tambah siswa, import,
// riwayat kelas di versi lama).
export default function ModalKelas({ show, onClose, title, width, children }) {
  if (!show) return null;
  return (
    <div className="modal-kelas show">
      <div className="modal-kelas-content" style={width ? { width } : undefined}>
        <div className="modal-kelas-header">
          <h3>{title}</h3>
          <button className="modal-kelas-close" onClick={onClose}>&#x2715;</button>
        </div>
        <div className="modal-kelas-body">{children}</div>
      </div>
    </div>
  );
}
