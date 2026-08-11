import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { loginKepsek } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';

export default function LoginKepsek() {
  const navigate = useNavigate();
  const { kepsek, loginAsKepsek } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (kepsek) {
      navigate('/dashboard-kepsek');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await loginKepsek(username, password);
    setIsSubmitting(false);

    if (result.success) {
      loginAsKepsek(result.kepsek);
      alert(`Selamat datang, ${result.kepsek.nama}!`);
      navigate('/dashboard-kepsek');
    } else {
      alert(result.error);
    }
  }

  return (
    <AuthLayout theme="kepsek">
      <div className="auth-logo">
        <div className="auth-logo-icon">🏫</div>
      </div>

      <span className="auth-role-badge">🔑 Akses Manajemen</span>
      <h1 className="auth-title">Login Kepala Sekolah</h1>
      <p className="auth-subtitle">Monitoring &amp; Evaluasi Layanan BK</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            placeholder="Masukkan username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="auth-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Memproses...' : 'Login sebagai Kepala Sekolah'}
        </button>
      </form>

      <Link to="/login" className="auth-link">
        ← Kembali ke Login Siswa
      </Link>
    </AuthLayout>
  );
}
