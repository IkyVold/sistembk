import { KELAS_OPTIONS_BY_TINGKAT } from '../constants';

export default function KelasSelect({ id, value, onChange, includeAllOption, disabled }) {
  return (
    <select id={id} value={value} onChange={onChange} disabled={disabled}>
      {includeAllOption ? (
        <option value="">🏫 Semua Kelas</option>
      ) : (
        <option value="">Pilih Kelas</option>
      )}
      {Object.entries(KELAS_OPTIONS_BY_TINGKAT).map(([tingkat, opsi]) => (
        <optgroup label={`Kelas ${tingkat}`} key={tingkat}>
          {opsi.map((kelas) => (
            <option value={kelas} key={kelas}>
              {kelas}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
