import { KATEGORI_COLORS } from '../constants';

export default function KategoriBarChart({ stats }) {
  const data = KATEGORI_COLORS.map((k) => ({ ...k, value: stats[k.key] }));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return <div style={{ textAlign: 'center', color: 'var(--gray-600)' }}>Belum ada data</div>;
  }

  const max = Math.max(...data.map((d) => d.value)) || 1;
  const width = 620;
  const height = 280;
  const padLeft = 40;
  const padBottom = 50;
  const padTop = 20;
  const padRight = 20;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const barGap = 24;
  const barW = (chartW - barGap * (data.length - 1)) / data.length;
  const steps = 4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: '640px', height: 'auto', fontFamily: 'inherit' }}>
      <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartH} stroke="var(--gray-100)" strokeWidth="1.5" />
      <line x1={padLeft} y1={padTop + chartH} x2={padLeft + chartW} y2={padTop + chartH} stroke="var(--gray-100)" strokeWidth="1.5" />

      {Array.from({ length: steps + 1 }, (_, i) => {
        const val = Math.round((max / steps) * i);
        const y = padTop + chartH - (val / max) * chartH;
        return (
          <g key={i}>
            <line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke="var(--gray-50)" strokeWidth="1" />
            <text x={padLeft - 8} y={y + 4} fontSize="11" fill="var(--gray-400)" textAnchor="end">
              {val}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const barH = (d.value / max) * chartH;
        const x = padLeft + i * (barW + barGap);
        const y = padTop + chartH - barH;
        return (
          <g key={d.key}>
            <rect x={x} y={y} width={barW} height={barH} fill={d.color} rx="4" />
            <text x={x + barW / 2} y={y - 8} fontSize="13" fontWeight="700" fill="var(--gray-800)" textAnchor="middle">
              {d.value}
            </text>
            <text x={x + barW / 2} y={padTop + chartH + 20} fontSize="12" fill="var(--gray-600)" textAnchor="middle">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
