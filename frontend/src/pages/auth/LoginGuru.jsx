import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import logoSmanda from '../../assets/logo-smanda.png';
import { loginGuruBk } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';

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

export default function LoginGuru() {
  const navigate = useNavigate();
  const { guru, loginAsGuru } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (guru) {
      navigate('/dashboard-guru');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      alert('Username dan password harus diisi');
      return;
    }

    setIsSubmitting(true);
    const result = await loginGuruBk(username.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      loginAsGuru(result.guru);
      navigate('/dashboard-guru');
    } else {
      alert(result.error);
    }
  }

  return (
    <AuthLayout theme="guru">
      <div className="auth-logo">
        <img src={logoSmanda} alt="Logo SMAN Darussholah Singojuruh" />
      </div>
      <p className="auth-school">SMAN Darussholah Singojuruh</p>

      <h1 className="auth-title">Login Guru BK</h1>
      <p className="auth-subtitle">
        Masukkan Username dan Password untuk
        <br />
        mengakses layanan konseling
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            placeholder="Contoh: joko_bk"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <div className="auth-password-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="Masukan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
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
        </div>

        <button type="submit" className="auth-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Memproses...' : 'Login'}
        </button>
      </form>

      <div className="auth-switch">
        <div className="auth-switch-label">Login sebagai</div>
        <div className="auth-switch-links">
          <Link to="/login" className="auth-switch-link">
            <UserIcon />
            Siswa
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
