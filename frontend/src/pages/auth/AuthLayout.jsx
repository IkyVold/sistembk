import '../../styles/auth.css';

/**
 * Kerangka visual yang sama untuk semua halaman login/registrasi,
 * hanya beda warna tema (siswa/guru/kepsek) dan lebar container.
 */
export default function AuthLayout({ theme, wide = false, children }) {
  return (
    <div className={`auth-page theme-${theme}`}>
      <div className={`auth-container ${wide ? 'wide' : ''}`}>
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}
