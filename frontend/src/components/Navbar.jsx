import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import '../styles/siswaNav.css';

export default function Navbar() {
  const { siswa, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const nama = siswa?.nama || 'Siswa';
  const firstName = nama.split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      logout('siswa');
      alert('Logout berhasil!');
      navigate('/login');
    }
  }

  return (
    <nav>
      <NavLink to="/" className="logo">
        <div className="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        Sman darussholah singonjuruh
      </NavLink>
      <div className="nav-links">
        <NavLink to="/" end>
          Beranda
        </NavLink>
        <NavLink to="/pilih">Konseling</NavLink>
        <NavLink to="/status">Status</NavLink>
        <div className="nav-divider" />
        <NotificationBell />
        <div className="nav-divider" />
        <div className="profile-dropdown" ref={dropdownRef}>
          <button className="profile-btn" onClick={() => setDropdownOpen((v) => !v)}>
            <div className="avatar-circle">{initial}</div>
            <span>{firstName}</span>
            <svg className="chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6l4 4 4-4" />
            </svg>
          </button>
          <div className={`dropdown-content ${dropdownOpen ? 'show' : ''}`}>
            <NavLink to="/profile" onClick={() => setDropdownOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              Lihat profil
            </NavLink>
            <button onClick={handleLogout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Keluar
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
