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

  useEffect(() => {
    if (guru) {
      navigate('/guru-bk');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    const result = loginGuruBk(username, password);

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
      <p className="auth-subtitle">Masuk ke dashboard konseling</p>

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

        <button type="submit" className="auth-btn">
          Login sebagai Guru BK
        </button>
      </form>

      <div className="auth-info-box">
        <h4>📋 Akun Demo Guru BK:</h4>
        <p>
          👨‍🏫 <strong>Joko Ardianto S.Pd</strong>
          <br />
          Username: <code>joko_bk</code> Password: <code>guru123</code>
        </p>
        <p>
          👩‍🏫 <strong>wiwiek Hariati S.Pd</strong>
          <br />
          Username: <code>wiwiek_bk</code> Password: <code>guru123</code>
        </p>
        <p>
          👨‍🏫 <strong>Dicky Ardiansyah S.Pd</strong>
          <br />
          Username: <code>dicky_bk</code> Password: <code>guru123</code>
        </p>
        <p style={{ marginTop: '10px', fontSize: '12px' }}>
          ⚠️ Setiap guru hanya melihat laporan dari siswanya sendiri
        </p>
      </div>

      <Link to="/login" className="auth-link">
        ← Login sebagai Siswa
      </Link>

      <div className="auth-role-divider">
        <span>AKSES MANAJEMEN</span>
      </div>
      <Link to="/login-kepsek" className="auth-kepsek-link">
        🏫 Login sebagai Kepala Sekolah
      </Link>
    </AuthLayout>
  );
}
