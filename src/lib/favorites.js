const favKey = (type, userId) => `lebux_fav_${type}_${userId || 'anon'}`;

export function getFavoriteIds(type, userId) {
  try {
    const raw = localStorage.getItem(favKey(type, userId));
    if (!raw) return [];
    return JSON.parse(raw || '[]');
  } catch { return []; }
}

export function toggleFavorite(type, userId, id) {
  try {
    const key = favKey(type, userId);
    const current = getFavoriteIds(type, userId);
    const exists = current.includes(id);
    const next = exists ? current.filter(x => x !== id) : [...current, id];
    localStorage.setItem(key, JSON.stringify(next));
    return next;
  } catch { return []; }
}

export function isFavorited(type, userId, id) {
  try { return getFavoriteIds(type, userId).includes(id); } catch { return false; }
}
