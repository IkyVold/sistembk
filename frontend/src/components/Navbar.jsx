import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import Avatar from './Avatar';
import '../styles/siswaNav.css';

export default function Navbar() {
  const { siswa, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const nama = siswa?.nama || 'Siswa';
  const firstName = nama.split(' ')[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      logout('siswa');
      alert('Logout berhasil!');
      navigate('/login');
    }
  }

  return (
    <>
      <nav className="siswa-nav">
        <div className="nav-left">
          <button
            type="button"
            className={`nav-hamburger ${mobileMenuOpen ? 'open' : ''}`}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>

          <NavLink to="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="logo-text-full">SMAN Darussholah</span>
            <span className="logo-text-short">SMANDA</span>
          </NavLink>
        </div>

        <div className="nav-links nav-links-desktop">
          <NavLink to="/" end>
            Beranda
          </NavLink>
          <NavLink to="/pilih">Konseling</NavLink>
          <NavLink to="/status">Status</NavLink>
          <div className="nav-divider" />
          <NotificationBell />
          <div className="nav-divider" />
          <div className="profile-dropdown" ref={dropdownRef}>
            <button type="button" className="profile-btn" onClick={() => setDropdownOpen((v) => !v)}>
              <Avatar src={siswa?.foto_profile} name={nama} size={30} className="avatar-circle" />
              <span className="profile-name">{firstName}</span>
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
              <button type="button" onClick={handleLogout}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Keluar
              </button>
            </div>
          </div>
        </div>

        <div className="nav-right-mobile">
          <NotificationBell />
          <NavLink to="/profile" className="nav-avatar-link" aria-label="Profil">
            <Avatar src={siswa?.foto_profile} name={nama} size={32} className="avatar-circle" />
          </NavLink>
        </div>
      </nav>

      <div
        className={`nav-drawer-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />
      <aside className={`nav-drawer ${mobileMenuOpen ? 'open' : ''}`} aria-hidden={!mobileMenuOpen}>
        <div className="nav-drawer-header">
          <div className="nav-drawer-user">
            <Avatar src={siswa?.foto_profile} name={nama} size={44} className="avatar-circle" />
            <div>
              <div className="nav-drawer-name">{nama}</div>
              <div className="nav-drawer-meta">{siswa?.kelas || 'Siswa'}</div>
            </div>
          </div>
          <button type="button" className="nav-drawer-close" onClick={() => setMobileMenuOpen(false)} aria-label="Tutup">
            ✕
          </button>
        </div>
        <div className="nav-drawer-links">
          <NavLink to="/" end onClick={() => setMobileMenuOpen(false)}>
            <span className="drawer-icon">🏠</span> Beranda
          </NavLink>
          <NavLink to="/pilih" onClick={() => setMobileMenuOpen(false)}>
            <span className="drawer-icon">💬</span> Ajukan Konseling
          </NavLink>
          <NavLink to="/status" onClick={() => setMobileMenuOpen(false)}>
            <span className="drawer-icon">📋</span> Status Pengajuan
          </NavLink>
          <NavLink to="/history" onClick={() => setMobileMenuOpen(false)}>
            <span className="drawer-icon">🕐</span> Riwayat
          </NavLink>
          <NavLink to="/jadwal" onClick={() => setMobileMenuOpen(false)}>
            <span className="drawer-icon">📅</span> Jadwal
          </NavLink>
          <NavLink to="/profile" onClick={() => setMobileMenuOpen(false)}>
            <span className="drawer-icon">👤</span> Profil Saya
          </NavLink>
        </div>
        <div className="nav-drawer-footer">
          <button type="button" className="nav-drawer-logout" onClick={handleLogout}>
            Keluar
          </button>
        </div>
      </aside>

      <nav className="siswa-bottom-nav" aria-label="Navigasi utama">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" />
          </svg>
          <span>Beranda</span>
        </NavLink>
        <NavLink to="/pilih" className={({ isActive }) => (isActive ? 'active' : '')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Konseling</span>
        </NavLink>
        <NavLink to="/status" className={({ isActive }) => (isActive ? 'active' : '')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span>Status</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <span>Profil</span>
        </NavLink>
      </nav>
    </>
  );
}
