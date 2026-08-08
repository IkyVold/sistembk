import { KATEGORI_COLORS } from '../constants';
import { pct } from '../helpers';

export default function KategoriTable({ stats }) {
  const data = KATEGORI_COLORS.map((k) => ({ ...k, value: stats[k.key] })).sort((a, b) => b.value - a.value);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <tr>
        <td colSpan={3} style={{ textAlign: 'center', color: '#718096', padding: '24px' }}>
          Belum ada data konseling
        </td>
      </tr>
    );
  }

  return (
    <>
      {data.map((item) => (
        <tr key={item.key}>
          <td>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color, display: 'inline-block' }} />
              {item.label}
            </span>
          </td>
          <td>{item.value}</td>
          <td>{pct(item.value, total)}%</td>
        </tr>
      ))}
      <tr style={{ fontWeight: 700, borderTop: '2px solid #e2e8f0' }}>
        <td>Total</td>
        <td>{total}</td>
        <td>100%</td>
      </tr>
    </>
  );
}
