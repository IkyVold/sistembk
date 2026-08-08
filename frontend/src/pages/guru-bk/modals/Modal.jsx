// Modal gaya "detail" (dipakai untuk detailModal, laporanModal, walkinModal
// di versi lama). Ditampilkan lewat conditional render, bukan class .show,
// tapi className dasarnya tetap sama supaya CSS asli terpakai penuh.
export default function Modal({ show, onClose, title, headerStyle, footer, children, bodyId }) {
  if (!show) return null;
  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header" style={headerStyle}>
          <h3>{title}</h3>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body" id={bodyId}>
          {children}
        </div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
