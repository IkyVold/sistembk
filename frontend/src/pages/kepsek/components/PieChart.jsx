import { KATEGORI_COLORS } from '../constants';
import { pct } from '../helpers';

export default function PieChart({ stats }) {
  const data = KATEGORI_COLORS.map((k) => ({ ...k, value: stats[k.key] }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return <div style={{ textAlign: 'center', color: '#718096' }}>Belum ada data</div>;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;
  const gradientParts = data.map((d) => {
    const start = cumulative;
    cumulative += (d.value / total) * 360;
    return `${d.color} ${start}deg ${cumulative}deg`;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
      <div
        style={{
          position: 'relative',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: `conic-gradient(${gradientParts.join(', ')})`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{total}</div>
          <div style={{ fontSize: '11px', color: '#718096' }}>Total Kasus</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
        {data.map((item) => {
          const persen = pct(item.value, total);
          return (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <div style={{ width: '10px', height: '10px', background: item.color, borderRadius: '2px', flexShrink: 0 }} />
              <div style={{ width: '72px', flexShrink: 0, fontWeight: 600 }}>{item.label}</div>
              <div style={{ flex: 1, background: '#e2e8f0', height: '10px', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${persen}%`, background: item.color, height: '10px' }} />
              </div>
              <div style={{ width: '78px', textAlign: 'right', flexShrink: 0, color: '#4a5568' }}>
                {item.value} ({persen}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
