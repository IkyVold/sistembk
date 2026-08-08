import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { registerSiswa } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';

const NIS_REGEX = /^[0-9]{4}$/;

const KELAS_OPTIONS = [
  ...['X', 'XI', 'XII'].flatMap((tingkat) =>
    Array.from({ length: 10 }, (_, i) => `${tingkat} - ${i + 1}`)
  ),
];

const initialForm = {
  nama: '',
  nis: '',
  kelas: '',
  jenis_kelamin: '',
  password: '',
  confirmPassword: '',
};

export default function Registrasi() {
  const navigate = useNavigate();
  const { siswa, logout } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (siswa) {
      const wantsLogout = window.confirm('Anda sudah login. Ingin logout terlebih dahulu?');
      if (wantsLogout) {
        logout('siswa');
      } else {
        navigate('/');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const nextErrors = {};

    if (!form.nama.trim()) {
      nextErrors.nama = 'Nama harus diisi';
    }
    if (!form.nis.trim() || !NIS_REGEX.test(form.nis.trim())) {
      nextErrors.nis = 'NIS harus 4 digit angka';
    }
    if (!form.kelas) {
      nextErrors.kelas = 'Pilih kelas terlebih dahulu';
    }
    if (!form.jenis_kelamin) {
      nextErrors.jenis_kelamin = 'Pilih jenis kelamin';
    }
    if (!form.password || form.password.length < 4) {
      nextErrors.password = 'Password minimal 4 karakter';
    }
    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Password tidak cocok';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const payload = {
      nis: form.nis.trim(),
      nama: form.nama.trim(),
      kelas: form.kelas,
      jenis_kelamin: form.jenis_kelamin,
      password: form.password,
    };
    const result = await registerSiswa(payload);
    setIsSubmitting(false);

    if (result.success) {
      alert(
        `✅ Registrasi berhasil!\n\nSelamat datang ${payload.nama}\nNIS: ${payload.nis}\nKelas: ${payload.kelas}\nJenis Kelamin: ${payload.jenis_kelamin}\n\nSilakan login menggunakan NIS dan password Anda.`
      );
      navigate('/login');
    } else {
      alert(`❌ Registrasi gagal!\n\n${result.error}`);
    }
  }

  return (
    <AuthLayout theme="siswa" wide>
      <div className="auth-logo">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg"
          alt="Logo Kemdikbud"
        />
      </div>

      <h1 className="auth-title">Registrasi Siswa</h1>
      <p className="auth-subtitle">Silakan isi data diri dengan lengkap</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="nama">
            Nama Lengkap <span className="required">*</span>
          </label>
          <input
            type="text"
            id="nama"
            placeholder="Contoh: Ahmad Wijaya"
            autoComplete="off"
            className={errors.nama ? 'error' : ''}
            value={form.nama}
            onChange={(e) => updateField('nama', e.target.value)}
            required
          />
          <div className={`auth-error-message ${errors.nama ? 'show' : ''}`}>{errors.nama}</div>
        </div>

        <div className="auth-field">
          <label htmlFor="nis">
            NIS (4 digit) <span className="required">*</span>
          </label>
          <input
            type="text"
            id="nis"
            placeholder="Contoh: 1001"
            maxLength={4}
            pattern="[0-9]{4}"
            autoComplete="off"
            className={errors.nis ? 'error' : ''}
            value={form.nis}
            onChange={(e) => updateField('nis', e.target.value)}
            required
          />
          <div className={`auth-error-message ${errors.nis ? 'show' : ''}`}>{errors.nis}</div>
        </div>

        <div className="auth-field">
          <label htmlFor="kelas">
            Kelas <span className="required">*</span>
          </label>
          <select
            id="kelas"
            className={errors.kelas ? 'error' : ''}
            value={form.kelas}
            onChange={(e) => updateField('kelas', e.target.value)}
            required
          >
            <option value="">Pilih Kelas</option>
            {KELAS_OPTIONS.map((kelas) => (
              <option key={kelas} value={kelas}>
                {kelas}
              </option>
            ))}
          </select>
          <div className={`auth-error-message ${errors.kelas ? 'show' : ''}`}>{errors.kelas}</div>
        </div>

        <div className="auth-field">
          <label htmlFor="jenis_kelamin">
            Jenis Kelamin <span className="required">*</span>
          </label>
          <select
            id="jenis_kelamin"
            className={errors.jenis_kelamin ? 'error' : ''}
            value={form.jenis_kelamin}
            onChange={(e) => updateField('jenis_kelamin', e.target.value)}
            required
          >
            <option value="">Pilih Jenis Kelamin</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
          <div className={`auth-error-message ${errors.jenis_kelamin ? 'show' : ''}`}>
            {errors.jenis_kelamin}
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="password">
            Password <span className="required">*</span>
          </label>
          <input
            type="password"
            id="password"
            placeholder="Minimal 4 karakter"
            className={errors.password ? 'error' : ''}
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            required
          />
          <div className={`auth-error-message ${errors.password ? 'show' : ''}`}>
            {errors.password}
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="confirm-password">
            Konfirmasi Password <span className="required">*</span>
          </label>
          <input
            type="password"
            id="confirm-password"
            placeholder="Ulangi password"
            className={errors.confirmPassword ? 'error' : ''}
            value={form.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            required
          />
          <div className={`auth-error-message ${errors.confirmPassword ? 'show' : ''}`}>
            {errors.confirmPassword}
          </div>
        </div>

        <button type="submit" className="auth-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Mendaftar...' : 'Daftar'}
        </button>

        <Link to="/login" className="auth-link">
          Sudah punya akun? Login
        </Link>
      </form>

      <div className="auth-info-note">
        <strong>📌 Informasi Penting:</strong>
        <ul>
          <li>
            NIS (Nomor Induk Siswa) terdiri dari <strong>4 digit angka</strong>
          </li>
          <li>Simpan NIS dan password Anda dengan baik untuk login nanti</li>
          <li>Data jenis kelamin akan digunakan untuk keperluan administrasi</li>
          <li>Data alamat dan tanggal lahir dapat diisi nanti di halaman Profile</li>
        </ul>
      </div>
    </AuthLayout>
  );
}
