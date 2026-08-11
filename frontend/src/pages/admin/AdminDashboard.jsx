import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { activateRoleToken } from '../../api/tokenStore';
import {
  fetchGuruBkAdmin,
  createGuruBk,
  updateGuruBk,
  deleteGuruBk,
  fetchKepsekAdmin,
  createKepsek,
  updateKepsek,
  deleteKepsek,
} from '../../api/akunService';
import './admin.css';

const emptyGuru = { username: '', password: '', nama: '', spesialisasi: 'Guru BK', npsn: '', alamat: '' };
const emptyKepsek = { username: '', password: '', nama: '', nip: '', sekolah: '', jabatan: 'Kepala Sekolah' };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [tab, setTab] = useState('guru');
  const [guruList, setGuruList] = useState([]);
  const [kepsekList, setKepsekList] = useState([]);
  const [guruForm, setGuruForm] = useState(emptyGuru);
  const [kepsekForm, setKepsekForm] = useState(emptyKepsek);
  const [editGuruId, setEditGuruId] = useState(null);
  const [editKepsekId, setEditKepsekId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!admin) {
      navigate('/login-admin');
      return;
    }
    activateRoleToken('admin');
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  async function loadAll() {
    setLoading(true);
    const [g, k] = await Promise.all([fetchGuruBkAdmin(), fetchKepsekAdmin()]);
    if (g.success) setGuruList(g.data);
    if (k.success) setKepsekList(k.data);
    setLoading(false);
  }

  async function handleSaveGuru(e) {
    e.preventDefault();
    const payload = { ...guruForm };
    if (editGuruId && !payload.password) delete payload.password;
    const res = editGuruId
      ? await updateGuruBk(editGuruId, payload)
      : await createGuruBk(payload);
    if (res.success) {
      alert(res.message);
      setGuruForm(emptyGuru);
      setEditGuruId(null);
      loadAll();
    } else {
      alert(res.error);
    }
  }

  async function handleSaveKepsek(e) {
    e.preventDefault();
    const payload = { ...kepsekForm };
    if (editKepsekId && !payload.password) delete payload.password;
    const res = editKepsekId
      ? await updateKepsek(editKepsekId, payload)
      : await createKepsek(payload);
    if (res.success) {
      alert(res.message);
      setKepsekForm(emptyKepsek);
      setEditKepsekId(null);
      loadAll();
    } else {
      alert(res.error);
    }
  }

  function startEditGuru(g) {
    setEditGuruId(g.id);
    setGuruForm({
      username: g.username,
      password: '',
      nama: g.nama,
      spesialisasi: g.spesialisasi || 'Guru BK',
      npsn: g.npsn || '',
      alamat: g.alamat || '',
      is_active: g.is_active,
    });
  }

  function startEditKepsek(k) {
    setEditKepsekId(k.id);
    setKepsekForm({
      username: k.username,
      password: '',
      nama: k.nama,
      nip: k.nip || '',
      sekolah: k.sekolah || '',
      jabatan: k.jabatan || 'Kepala Sekolah',
      is_active: k.is_active,
    });
  }

  async function handleDeleteGuru(id, nama) {
    if (!window.confirm(`Nonaktifkan akun Guru BK "${nama}"?\nAkun tidak akan muncul di Pilih Guru siswa.`)) return;
    const res = await deleteGuruBk(id);
    if (res.success) {
      alert(res.message);
      loadAll();
    } else alert(res.error);
  }

  async function handleDeleteKepsek(id, nama) {
    if (!window.confirm(`Nonaktifkan akun Kepala Sekolah "${nama}"?`)) return;
    const res = await deleteKepsek(id);
    if (res.success) {
      alert(res.message);
      loadAll();
    } else alert(res.error);
  }

  async function toggleGuruActive(g) {
    const res = await updateGuruBk(g.id, { is_active: g.is_active ? 0 : 1 });
    if (res.success) loadAll();
    else alert(res.error);
  }

  function handleLogout() {
    logout('admin');
    navigate('/login-admin');
  }

  if (!admin) return null;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>⚙️ Admin</h1>
          <p>Kelola akun Guru BK &amp; Kepala Sekolah</p>
        </div>
        <div className="admin-user">
          <span>{admin.nama || admin.username}</span>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="admin-tabs">
        <button type="button" className={tab === 'guru' ? 'active' : ''} onClick={() => setTab('guru')}>
          Guru BK ({guruList.length})
        </button>
        <button type="button" className={tab === 'kepsek' ? 'active' : ''} onClick={() => setTab('kepsek')}>
          Kepala Sekolah ({kepsekList.length})
        </button>
      </div>

      {loading && <p className="admin-loading">Memuat data...</p>}

      {tab === 'guru' && (
        <div className="admin-panel">
          <form className="admin-form" onSubmit={handleSaveGuru}>
            <h3>{editGuruId ? 'Edit Guru BK' : 'Tambah Guru BK'}</h3>
            <div className="admin-form-grid">
              <input placeholder="Username *" value={guruForm.username} onChange={(e) => setGuruForm({ ...guruForm, username: e.target.value })} required />
              <input placeholder={editGuruId ? 'Password (kosongkan jika tidak diubah)' : 'Password *'} type="password" value={guruForm.password} onChange={(e) => setGuruForm({ ...guruForm, password: e.target.value })} required={!editGuruId} />
              <input placeholder="Nama lengkap *" value={guruForm.nama} onChange={(e) => setGuruForm({ ...guruForm, nama: e.target.value })} required />
              <input placeholder="Spesialisasi" value={guruForm.spesialisasi} onChange={(e) => setGuruForm({ ...guruForm, spesialisasi: e.target.value })} />
              <input placeholder="NPSN" value={guruForm.npsn} onChange={(e) => setGuruForm({ ...guruForm, npsn: e.target.value })} />
              <input placeholder="Alamat" value={guruForm.alamat} onChange={(e) => setGuruForm({ ...guruForm, alamat: e.target.value })} />
            </div>
            <div className="admin-form-actions">
              <button type="submit">{editGuruId ? 'Simpan Perubahan' : 'Tambah Akun'}</button>
              {editGuruId && (
                <button type="button" className="btn-secondary" onClick={() => { setEditGuruId(null); setGuruForm(emptyGuru); }}>
                  Batal
                </button>
              )}
            </div>
          </form>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Username</th>
                <th>Spesialisasi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {guruList.map((g) => (
                <tr key={g.id} className={g.is_active ? '' : 'inactive'}>
                  <td>{g.nama}</td>
                  <td><code>{g.username}</code></td>
                  <td>{g.spesialisasi}</td>
                  <td>
                    <button type="button" className={`badge ${g.is_active ? 'on' : 'off'}`} onClick={() => toggleGuruActive(g)}>
                      {g.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="actions">
                    <button type="button" onClick={() => startEditGuru(g)}>Edit</button>
                    <button type="button" className="danger" onClick={() => handleDeleteGuru(g.id, g.nama)}>Nonaktifkan</button>
                  </td>
                </tr>
              ))}
              {guruList.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>Belum ada akun Guru BK</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'kepsek' && (
        <div className="admin-panel">
          <form className="admin-form" onSubmit={handleSaveKepsek}>
            <h3>{editKepsekId ? 'Edit Kepala Sekolah' : 'Tambah Kepala Sekolah'}</h3>
            <div className="admin-form-grid">
              <input placeholder="Username *" value={kepsekForm.username} onChange={(e) => setKepsekForm({ ...kepsekForm, username: e.target.value })} required />
              <input placeholder={editKepsekId ? 'Password (kosongkan jika tidak diubah)' : 'Password *'} type="password" value={kepsekForm.password} onChange={(e) => setKepsekForm({ ...kepsekForm, password: e.target.value })} required={!editKepsekId} />
              <input placeholder="Nama lengkap *" value={kepsekForm.nama} onChange={(e) => setKepsekForm({ ...kepsekForm, nama: e.target.value })} required />
              <input placeholder="NIP" value={kepsekForm.nip} onChange={(e) => setKepsekForm({ ...kepsekForm, nip: e.target.value })} />
              <input placeholder="Sekolah" value={kepsekForm.sekolah} onChange={(e) => setKepsekForm({ ...kepsekForm, sekolah: e.target.value })} />
              <input placeholder="Jabatan" value={kepsekForm.jabatan} onChange={(e) => setKepsekForm({ ...kepsekForm, jabatan: e.target.value })} />
            </div>
            <div className="admin-form-actions">
              <button type="submit">{editKepsekId ? 'Simpan Perubahan' : 'Tambah Akun'}</button>
              {editKepsekId && (
                <button type="button" className="btn-secondary" onClick={() => { setEditKepsekId(null); setKepsekForm(emptyKepsek); }}>
                  Batal
                </button>
              )}
            </div>
          </form>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Username</th>
                <th>Sekolah</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {kepsekList.map((k) => (
                <tr key={k.id} className={k.is_active ? '' : 'inactive'}>
                  <td>{k.nama}</td>
                  <td><code>{k.username}</code></td>
                  <td>{k.sekolah || '–'}</td>
                  <td>
                    <span className={`badge ${k.is_active ? 'on' : 'off'}`}>
                      {k.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="actions">
                    <button type="button" onClick={() => startEditKepsek(k)}>Edit</button>
                    <button type="button" className="danger" onClick={() => handleDeleteKepsek(k.id, k.nama)}>Nonaktifkan</button>
                  </td>
                </tr>
              ))}
              {kepsekList.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>Belum ada akun Kepala Sekolah</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
