import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { loginGuruBk } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';

export default function LoginGuru() {
  const navigate = useNavigate();
  const { guru, loginAsGuru } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (guru) {
      navigate('/guru-bk');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await loginGuruBk(username, password);
    setIsSubmitting(false);

    if (result.success) {
      loginAsGuru(result.guru);
      alert(`Selamat datang, ${result.guru.nama}!`);
      navigate('/guru-bk');
    } else {
      alert(result.error);
    }
  }

  return (
    <AuthLayout theme="guru">
      <div className="auth-logo">
        <div className="auth-logo-icon">📚</div>
      </div>

      <h1 className="auth-title">Login Guru BK</h1>
      <p className="auth-subtitle">Kelola pengajuan konseling dan laporan siswa</p>

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
          {isSubmitting ? 'Memproses...' : 'Login sebagai Guru BK'}
        </button>
      </form>

      <Link to="/login" className="auth-link">
        ← Kembali ke Login Siswa
      </Link>
    </AuthLayout>
  );
}
