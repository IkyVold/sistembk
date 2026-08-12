/**
 * Session chat selalu terikat ke satu baris konseling.
 * Format: konseling_<id>
 */
export function sessionIdFromKonselingId(konselingId) {
  const id = Number(konselingId);
  if (!id || Number.isNaN(id)) {
    throw new Error('konselingId tidak valid untuk session chat');
  }
  return `konseling_${id}`;
}

export function parseKonselingIdFromSession(sessionId) {
  const m = String(sessionId || '').match(/^konseling_(\d+)$/);
  return m ? Number(m[1]) : null;
}
