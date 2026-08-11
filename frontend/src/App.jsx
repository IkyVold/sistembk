import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginSiswa from './pages/auth/LoginSiswa';
import LoginGuru from './pages/auth/LoginGuru';
import LoginKepsek from './pages/auth/LoginKepsek';
import LoginAdmin from './pages/auth/LoginAdmin';
import AdminDashboard from './pages/admin/AdminDashboard';
import PilihGuru from './pages/PilihGuru';
import Beranda from './pages/siswa/Beranda';
import Jadwal from './pages/siswa/Jadwal';
import Status from './pages/siswa/Status';
import History from './pages/siswa/History';
import DetailHistory from './pages/siswa/DetailHistory';
import Profile from './pages/siswa/Profile';
import ChatSiswa from './pages/chat/ChatSiswa';
import ChatGuru from './pages/chat/ChatGuru';
import GuruBkDashboard from './pages/guru-bk/GuruBkDashboard';
import KepsekDashboard from './pages/kepsek/KepsekDashboard';
import ComingSoon from './pages/ComingSoon';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginSiswa />} />
        <Route path="/login-guru" element={<LoginGuru />} />
        <Route path="/login-kepsek" element={<LoginKepsek />} />
        <Route path="/login-admin" element={<LoginAdmin />} />
        <Route path="/dashboard-admin" element={<AdminDashboard />} />

        {/* Area siswa (butuh login siswa) */}
        <Route
          path="/pilih"
          element={
            <ProtectedRoute role="siswa" redirectTo="/login">
              <PilihGuru />
            </ProtectedRoute>
          }
        />

        {/* Beranda siswa: kalau belum login, ProtectedRoute otomatis lempar ke /login */}
        <Route
          path="/"
          element={
            <ProtectedRoute role="siswa" redirectTo="/login">
              <Beranda />
            </ProtectedRoute>
          }
        />
        <Route
          path="/status"
          element={
            <ProtectedRoute role="siswa" redirectTo="/login">
              <Status />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jadwal"
          element={
            <ProtectedRoute role="siswa" redirectTo="/login">
              <Jadwal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute role="siswa" redirectTo="/login">
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history/:id"
          element={
            <ProtectedRoute role="siswa" redirectTo="/login">
              <DetailHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute role="siswa" redirectTo="/login">
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat-siswa"
          element={
            <ProtectedRoute role="siswa" redirectTo="/login">
              <ChatSiswa />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guru-bk"
          element={
            <ProtectedRoute role="guru" redirectTo="/login-guru">
              <GuruBkDashboard />
            </ProtectedRoute>
          }
        />
        {/* Alias lama — login sebelumnya sempat mengarah ke /dashboard-guru */}
        <Route
          path="/dashboard-guru"
          element={
            <ProtectedRoute role="guru" redirectTo="/login-guru">
              <GuruBkDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat-guru"
          element={
            <ProtectedRoute role="guru" redirectTo="/login-guru">
              <ChatGuru />
            </ProtectedRoute>
          }
        />
        <Route path="/cetak-laporan" element={<ComingSoon title="Cetak Laporan PDF" />} />
        <Route
          path="/dashboard-kepsek"
          element={
            <ProtectedRoute role="kepsek" redirectTo="/login-kepsek">
              <KepsekDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<ComingSoon title="Halaman tidak ditemukan" />} />
      </Routes>
    </AuthProvider>
  );
}
