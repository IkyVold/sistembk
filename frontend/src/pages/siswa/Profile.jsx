import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosClient, { extractErrorMessage } from '../../api/axiosClient';
import Avatar from '../../components/Avatar';
import './profile.css';

const KELAS_OPTIONS = ['X', 'XI', 'XII'].flatMap((tingkat) =>
  Array.from({ length: 10 }, (_, i) => `${tingkat} - ${i + 1}`)
);

function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateString;
  }
}

const FIELD_LABELS = {
  jenis_kelamin: 'Jenis Kelamin',
  tanggal_lahir: 'Tanggal Lahir',
  alamat: 'Alamat',
  no_telepon: 'No. Telepon',
};

export default function Profile() {
  const navigate = useNavigate();
  const { siswa, logout, updateSiswaFoto } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [editField, setEditField] = useState(null); // 'jenis_kelamin' | 'tanggal_lahir' | 'alamat' | 'no_telepon' | null
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const fileInputRef = useRef(null);

  const loadProfile = () => {
    const nis = siswa?.nis;
    if (!nis) {
      navigate('/login');
      return;
    }
    setLoadError(false);
    axiosClient
      .get(`/api/profile/${nis}`)
      .then(({ data }) => setProfile(data))
      .catch((err) => {
        console.error('Error loading profile:', err);
        setLoadError(true);
      });
  };

  useEffect(loadProfile, [siswa?.nis]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      logout('siswa');
      alert('Logout berhasil!');
      navigate('/login');
    }
  }

  function openEditModal(field) {
    setEditField(field);
    setEditValue(profile[field] || '');
  }

  function closeModal() {
    setEditField(null);
    setEditValue('');
  }

  async function saveEdit() {
    setIsSaving(true);
    try {
      const { data } = await axiosClient.put(`/api/profile/${profile.nis}`, { [editField]: editValue });
      if (!data.success) throw new Error(data.error || 'Unknown error');

      alert('✅ Profile berhasil diupdate!');
      closeModal();
      loadProfile();
    } catch (err) {
      alert(`❌ Gagal mengupdate profile: ${extractErrorMessage(err, 'Unknown error')}`);
    } finally {
      setIsSaving(false);
    }
  }

  function editFoto() {
    fileInputRef.current?.click();
  }

  async function handleFotoChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // biar bisa pilih file yang sama lagi kalau mau
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('❌ Format foto harus JPG, PNG, atau WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('❌ Ukuran foto maksimal 2MB.');
      return;
    }

    setIsUploadingFoto(true);
    try {
      const formData = new FormData();
      formData.append('foto', file);

      // Content-Type sengaja di-set undefined: axios instance ini punya default
      // 'application/json', tapi untuk FormData kita perlu boundary otomatis dari
      // browser. Set eksplisit ke undefined memaksa axios membiarkan browser yang
      // menentukan Content-Type + boundary yang benar untuk multipart/form-data.
      const { data } = await axiosClient.put(`/api/profile/${profile.nis}/foto`, formData, {
        headers: { 'Content-Type': undefined },
      });
      if (!data.success) throw new Error(data.error || 'Gagal mengunggah foto');

      setProfile((prev) => ({ ...prev, foto_profile: data.foto_profile }));
      updateSiswaFoto(data.foto_profile);
    } catch (err) {
      alert(`❌ Gagal mengunggah foto: ${extractErrorMessage(err, 'Unknown error')}`);
    } finally {
      setIsUploadingFoto(false);
    }
  }

  async function handleHapusFoto() {
    if (!profile?.foto_profile) return;
    if (!confirm('Hapus foto profil? Avatar akan kembali ke inisial nama.')) return;

    setIsUploadingFoto(true);
    try {
      const { data } = await axiosClient.delete(`/api/profile/${profile.nis}/foto`);
      if (!data.success) throw new Error(data.error || 'Unknown error');

      setProfile((prev) => ({ ...prev, foto_profile: null }));
      updateSiswaFoto(null);
    } catch (err) {
      alert(`❌ Gagal menghapus foto: ${extractErrorMessage(err, 'Unknown error')}`);
    } finally {
      setIsUploadingFoto(false);
    }
  }



  return (
    <div className="profile-page">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">🛡️</div>
            <h2>StopBully</h2>
          </div>
          <p>Student Portal</p>
        </div>
        <div className="sidebar-divider" />
        <p className="sidebar-section-label">Menu</p>
        <ul className="sidebar-menu">
          <li>
            <Link to="/profile" className="active">
              <span className="menu-icon">👤</span>
              <span>Profile</span>
            </Link>
          </li>
          <li>
            <Link to="/history">
              <span className="menu-icon">📋</span>
              <span>History</span>
            </Link>
          </li>
        </ul>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <div className="page-header-left">
            <div className="breadcrumb">
              <Link to="/">Home</Link>
              <span>/</span>Profile
            </div>
            <h1>Profil Saya</h1>
          </div>
        </div>

        <div>
          {!profile && !loadError && <div className="loading">Loading profile data...</div>}
          {loadError && (
            <div className="loading" style={{ color: 'var(--danger)' }}>
              ❌ Gagal memuat data profile.
              <br />
              Pastikan server backend berjalan.
            </div>
          )}

          {profile && (
            <div className="profile-grid">
              <div className="card identity-card">
                <div className="identity-card-banner" />
                <div className="identity-card-body">
                  <div className="profile-avatar-wrap">
                    <Avatar src={profile.foto_profile} name={profile.nama} size={80} />
                    <div className="avatar-edit-overlay" onClick={editFoto}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span>{isUploadingFoto ? 'Mengunggah...' : 'Ganti Foto'}</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleFotoChange}
                    />
                  </div>
                  <div className="avatar-actions">
                    <button className="avatar-action-btn" onClick={editFoto} disabled={isUploadingFoto}>
                      📷 {profile.foto_profile ? 'Ganti Foto' : 'Upload Foto'}
                    </button>
                    {profile.foto_profile && (
                      <button className="avatar-action-btn danger" onClick={handleHapusFoto} disabled={isUploadingFoto}>
                        🗑️ Hapus
                      </button>
                    )}
                  </div>
                  <div className="profile-name">{profile.nama || '-'}</div>
                  <div className="profile-role">
                    <span className="role-dot" />
                    <span>Siswa/Siswi Aktif</span>
                  </div>
                  <div className="identity-stats">
                    <div className="stat-chip">
                      <div className="stat-chip-value">{profile.nis || '-'}</div>
                      <div className="stat-chip-label">NIS</div>
                    </div>
                    <div className="stat-chip">
                      <div className="stat-chip-value">{profile.kelas || '-'}</div>
                      <div className="stat-chip-label">Kelas</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card info-card">
                <div className="card-title">
                  <div className="card-title-icon">📄</div>
                  Data Diri
                </div>

                <div className="info-list">
                  <div className="info-row">
                    <div className="info-label">Nama Lengkap</div>
                    <div className="info-value highlight">{profile.nama || '-'}</div>
                    <div></div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">NIS</div>
                    <div className="info-value highlight">{profile.nis || '-'}</div>
                    <div></div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">Kelas</div>
                    <div className="info-value highlight">{profile.kelas || '-'}</div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#a0aec0', fontStyle: 'italic' }}>
                        Diatur oleh Guru BK
                      </span>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">Jenis Kelamin</div>
                    <div className={`info-value ${!profile.jenis_kelamin ? 'empty' : ''}`}>
                      {profile.jenis_kelamin || 'Belum diisi'}
                    </div>
                    <div>
                      <button className="edit-btn" onClick={() => openEditModal('jenis_kelamin')}>Edit</button>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">Tanggal Lahir</div>
                    <div className={`info-value ${!profile.tanggal_lahir ? 'empty' : ''}`}>
                      {profile.tanggal_lahir ? formatDate(profile.tanggal_lahir) : 'Belum diisi'}
                    </div>
                    <div>
                      <button className="edit-btn" onClick={() => openEditModal('tanggal_lahir')}>Edit</button>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">Alamat</div>
                    <div className={`info-value ${!profile.alamat ? 'empty' : ''}`}>
                      {profile.alamat || 'Belum diisi'}
                    </div>
                    <div>
                      <button className="edit-btn" onClick={() => openEditModal('alamat')}>Edit</button>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">No. Telepon</div>
                    <div className={`info-value ${!profile.no_telepon ? 'empty' : ''}`}>
                      {profile.no_telepon || 'Belum diisi'}
                    </div>
                    <div>
                      <button className="edit-btn" onClick={() => openEditModal('no_telepon')}>Edit</button>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">Terdaftar Sejak</div>
                    <div className="info-value">{formatDate(profile.created_at)}</div>
                    <div></div>
                  </div>
                </div>

                <div className="action-bar">
                  <Link to="/" className="btn btn-primary">🏠 Kembali ke Beranda</Link>
                  <button onClick={handleLogout} className="btn btn-ghost">🚪 Logout</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {editField && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit {FIELD_LABELS[editField]}</h3>
              <button className="close-modal" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              {editField === 'jenis_kelamin' && (
                <div className="modal-field">
                  <label>Jenis Kelamin</label>
                  <select value={editValue} onChange={(e) => setEditValue(e.target.value)}>
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              )}
              {editField === 'tanggal_lahir' && (
                <div className="modal-field">
                  <label>Tanggal Lahir</label>
                  <input type="date" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                </div>
              )}
              {editField === 'alamat' && (
                <div className="modal-field">
                  <label>Alamat Lengkap</label>
                  <textarea
                    rows={3}
                    placeholder="Masukkan alamat lengkap Anda"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                </div>
              )}
              {editField === 'no_telepon' && (
                <div className="modal-field">
                  <label>No. Telepon</label>
                  <input
                    type="tel"
                    placeholder="Contoh: 08123456789"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                </div>
              )}
              {editField === 'kelas' && (
                <div className="modal-field">
                  <label>Kelas</label>
                  <select value={editValue} onChange={(e) => setEditValue(e.target.value)}>
                    <option value="">Pilih Kelas</option>
                    {KELAS_OPTIONS.map((k) => (
                      <option value={k} key={k}>{k}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>Batal</button>
              <button className="btn-save" onClick={saveEdit} disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
