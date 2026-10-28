export type Progress = { schema: 1; mediaId: string; position: number; duration: number; rate: number; updatedAt: string; bookmarks: number[] };
export const STORAGE_KEY = 'elvin-listening-progress-v1';
export const MEDIA_ID = 'mzd-01-class-analysis-opening-official-v1';
export function validateProgress(raw: unknown): Progress | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<Progress>;
  if (p.schema !== 1 || p.mediaId !== MEDIA_ID || !Number.isFinite(p.position) || p.position! < 0 || !Number.isFinite(p.duration) || p.duration! <= 0 || p.position! > p.duration! + 1 || ![.75, 1, 1.25, 1.5, 2].includes(p.rate!)) return null;
  return { schema: 1, mediaId: MEDIA_ID, position: p.position!, duration: p.duration!, rate: p.rate!, updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : '', bookmarks: Array.isArray(p.bookmarks) ? p.bookmarks.filter(t => Number.isFinite(t) && t >= 0 && t <= p.duration!) : [] };
}
export function restoreTime(position: number, duration: number) {
  // Keep even an ended excerpt at its saved end. Only the explicit Play action restarts it.
  return Math.max(0, Math.min(Number.isFinite(position) ? position : 0, duration));
}
export function formatTime(t: number) { const n = Math.max(0, Math.floor(Number.isFinite(t) ? t : 0)); return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`; }
