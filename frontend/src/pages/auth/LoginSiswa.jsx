import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import logoSmanda from '../../assets/logo-smanda.png';
import { loginSiswa } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';

const NIS_REGEX = /^[0-9]{4}$/;

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function LoginSiswa() {
  const navigate = useNavigate();
  const { siswa, loginAsSiswa, logout } = useAuth();

  const [nis, setNis] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      navigate('/');
    } else {
      alert(`Login gagal!\n\n${result.error}`);
    }
  }

  return (
    <AuthLayout theme="siswa">
      <div className="auth-logo">
        <img src={logoSmanda} alt="Logo SMAN Darussholah Singojuruh" />
      </div>
      <p className="auth-school">SMAN Darussholah Singojuruh</p>

      <h1 className="auth-title">Login Siswa</h1>
      <p className="auth-subtitle">
        Masukkan NIS dan Password untuk
        <br />
        mengakses layanan konseling
      </p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="nis">NIS</label>
          <input
            type="text"
            id="nis"
            inputMode="numeric"
            maxLength={4}
            placeholder="Masukan NIS (4 digit angka)"
            value={nis}
            onChange={(e) => {
              setNis(e.target.value.replace(/\D/g, '').slice(0, 4));
              if (errors.nis) setErrors((prev) => ({ ...prev, nis: undefined }));
            }}
            className={errors.nis ? 'has-error' : ''}
            autoComplete="username"
          />
          {errors.nis ? (
            <div className="auth-field-error">{errors.nis}</div>
          ) : (
            <div className="auth-field-hint">NIS harus 4 digit angka (contoh: 1234)</div>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <div className="auth-password-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="Masukan password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              className={errors.password ? 'has-error' : ''}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          {errors.password && <div className="auth-field-error">{errors.password}</div>}
        </div>

        <button type="submit" className="auth-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Memproses...' : 'Login'}
        </button>
      </form>

      <div className="auth-switch">
        <div className="auth-switch-label">Login sebagai</div>
        <div className="auth-switch-links">
          <Link to="/login-guru" className="auth-switch-link">
            <UserIcon />
            Guru BK
          </Link>
          <Link to="/login-kepsek" className="auth-switch-link">
            <UserIcon />
            Kepala Sekolah
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
