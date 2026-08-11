import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { loginAdmin } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';

export default function LoginAdmin() {
  const navigate = useNavigate();
  const { admin, loginAsAdmin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (admin) navigate('/dashboard-admin');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await loginAdmin(username, password);
    setIsSubmitting(false);
    if (result.success) {
      loginAsAdmin(result.admin);
      alert(`Selamat datang, ${result.admin.nama}!`);
      navigate('/dashboard-admin');
    } else {
      alert(result.error);
    }
  }

  return (
    <AuthLayout theme="kepsek">
      <div className="auth-logo">
        <div className="auth-logo-icon">⚙️</div>
      </div>
      <span className="auth-role-badge">🔐 Admin</span>
      <h1 className="auth-title">Login Admin</h1>
      <p className="auth-subtitle">Kelola akun Guru BK &amp; Kepala Sekolah</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan username"
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />
        </div>
        <button type="submit" className="auth-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Memproses...' : 'Login Admin'}
        </button>
      </form>

      <Link to="/login" className="auth-link">
        ← Kembali ke Login Siswa
      </Link>
    </AuthLayout>
  );
}
