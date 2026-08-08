export default function ComingSoon({ title }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontFamily: 'Segoe UI, sans-serif',
        color: '#444',
        textAlign: 'center',
        padding: '20px',
      }}
    >
      <h1 style={{ fontSize: '24px' }}>{title}</h1>
      <p style={{ color: '#888' }}>Halaman ini menyusul pada tahap migrasi berikutnya.</p>
    </div>
  );
}
