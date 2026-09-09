/**
 * Utility functions to robustly parse UTC timestamps from SQLite/FastAPI
 * and format them in the user's local timezone (e.g. India Standard Time IST).
 */

export function parseDate(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  if (typeof dateStr === 'string') {
    let s = dateStr.trim();
    // If string like "YYYY-MM-DD HH:MM:SS" (from SQLite), convert to ISO UTC format
    if (!s.endsWith('Z') && !s.includes('+')) {
      s = s.replace(' ', 'T') + 'Z';
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }
  
  return new Date(dateStr);
}

export function formatDate(dateStr, options = {}) {
  const d = parseDate(dateStr);
  return d.toLocaleDateString(undefined, options);
}

export function formatTime(dateStr, options = { hour: '2-digit', minute: '2-digit' }) {
  const d = parseDate(dateStr);
  return d.toLocaleTimeString([], options);
}

export function formatDateTime(dateStr) {
  const d = parseDate(dateStr);
  return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
