import { useState } from 'react';
import { resolveMediaUrl } from '../utils/media';
import './Avatar.css';

/**
 * Avatar serbaguna dipakai di Navbar, Profile, Chat, dan tabel Guru BK.
 * - Kalau `src` ada (path foto dari backend) dan berhasil dimuat -> tampilkan foto.
 * - Kalau tidak ada / gagal dimuat -> tampilkan lingkaran inisial nama (bukan emoji,
 *   supaya warnanya selalu konsisten dengan tema, tidak tergantung font emoji OS).
 */
export default function Avatar({ src, name, size = 40, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const resolvedSrc = resolveMediaUrl(src);
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  const style = { width: size, height: size, fontSize: Math.max(12, size * 0.42) };

  if (resolvedSrc && !imgError) {
    return (
      <img
        src={resolvedSrc}
        alt={name || 'Foto profil'}
        className={`avatar-photo ${className}`}
        style={style}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`avatar-initial ${className}`} style={style}>
      {initial}
    </div>
  );
}
