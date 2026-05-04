// ── Price formatter ────────────────────────────────────
export const formatPrice = (price) =>
  `Rs${Number(price).toLocaleString('en-PK')}`;

// ── Error extractor from DRF response ─────────────────
export const extractError = (err) => {
  const data = err?.response?.data;
  if (!data) return 'Network error. Please try again.';
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  const first = Object.values(data)[0];
  if (Array.isArray(first)) return first[0];
  if (typeof first === 'string') return first;
  return 'Something went wrong.';
};

// ── FormData builder for multipart uploads ─────────────
export const buildFormData = (obj) => {
  const fd = new FormData();
  Object.entries(obj).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => fd.append(key, v));
    } else if (value !== undefined && value !== null) {
      fd.append(key, value);
    }
  });
  return fd;
};

// ── CNIC validator ─────────────────────────────────────
export const validateCNIC = (value) => {
  const cleaned = value.replace(/-/g, '');
  return /^\d{13}$/.test(cleaned);
};

// ── Status badge colour map ────────────────────────────
export const statusColour = {
  available: { bg: '#d8f3dc', color: '#1b4332' },
  sold:      { bg: '#f8d7da', color: '#721c24' },
  auction:   { bg: '#fff3cd', color: '#856404' },
  pending:   { bg: '#fff3cd', color: '#856404' },
  shipped:   { bg: '#cff4fc', color: '#055160' },
  delivered: { bg: '#d1e7dd', color: '#0f5132' },
  cancelled: { bg: '#f8d7da', color: '#721c24' },
};

// ── Truncate text ──────────────────────────────────────
export const truncate = (str, n = 60) =>
  str && str.length > n ? str.slice(0, n) + '…' : str;

// ── Category emoji map ─────────────────────────────────
export const categoryEmoji = {
  grains:      '🌾',
  fruits:      '🍎',
  vegetables:  '🥦',
  livestock:   '🐄',
  tools:       '🔧',
  fertilizers: '🌿',
};
