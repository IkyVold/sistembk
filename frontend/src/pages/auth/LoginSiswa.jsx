import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import logoSmanda from '../../assets/logo-smanda.png';
import { loginSiswa } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';

const NIS_REGEX = /^[0-9]{4}$/;

export default function LoginSiswa() {
  const navigate = useNavigate();
  const { siswa, loginAsSiswa, logout } = useAuth();

  const [nis, setNis] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sama seperti versi lama: kalau sudah login, tawarkan logout atau lempar ke beranda.
  useEffect(() => {
    if (siswa) {
      const wantsLogout = window.confirm(
        `Anda sudah login sebagai ${siswa.nama || 'siswa'}.\nIngin logout terlebih dahulu?`
      );
      if (wantsLogout) {
        logout('siswa');
      } else {
        navigate('/');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validate() {
    const nextErrors = {};
    if (!nis.trim() || !NIS_REGEX.test(nis.trim())) {
      nextErrors.nis = 'NIS harus 4 digit angka';
    }
    if (!password) {
      nextErrors.password = 'Password harus diisi';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await loginSiswa(nis.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      loginAsSiswa(result.siswa);
      alert(
        `✅ Login berhasil!\n\nSelamat datang, ${result.siswa.nama}\nKelas: ${result.siswa.kelas}\nNIS: ${result.siswa.nis}`
      );
      navigate('/');
    } else {
      alert(`❌ Login gagal!\n\n${result.error}`);
    }
  }

  return (
    <AuthLayout theme="siswa">
      <div className="auth-logo">
        <img src={logoSmanda} alt="Logo Kemdikbud" />
      </div>

      <h1 className="auth-title">Login Siswa</h1>
      <p className="auth-subtitle">Masukkan NIS dan Password untuk mengakses layanan konseling</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="nis">
            NIS <span className="required">*</span>
          </label>
          <input
            type="text"
            id="nis"
            placeholder="Masukkan NIS (4 digit)"
            maxLength={4}
            autoComplete="off"
            className={errors.nis ? 'error' : ''}
            value={nis}
            onChange={(e) => setNis(e.target.value)}
            required
          />
          <div className={`auth-error-message ${errors.nis ? 'show' : ''}`}>{errors.nis}</div>
        </div>

        <div className="auth-field">
          <label htmlFor="password">
            Password <span className="required">*</span>
          </label>
          <input
            type="password"
            id="password"
            placeholder="Masukkan password"
            className={errors.password ? 'error' : ''}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className={`auth-error-message ${errors.password ? 'show' : ''}`}>
            {errors.password}
          </div>
        </div>

        <button type="submit" className="auth-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Memproses...' : 'Login sebagai Siswa'}
        </button>
      </form>

      <div>
        <Link to="/login-guru" className="auth-guru-link">
          📚 Login sebagai Guru BK
        </Link>
      </div>

      <div className="auth-role-divider">
        <span>AKSES MANAJEMEN</span>
      </div>
      <Link to="/login-kepsek" className="auth-kepsek-link">
        🏫 Login sebagai Kepala Sekolah
      </Link>
      <Link to="/login-admin" className="auth-kepsek-link" style={{ marginTop: 8, display: 'inline-block' }}>
        ⚙️ Login Admin
      </Link>
    </AuthLayout>
  );
}
