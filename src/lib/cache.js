const caches = new Map();
const DEFAULT_TTL = 10_000;

export function getCache(key) {
  const entry = caches.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    caches.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key, data, ttl = DEFAULT_TTL) {
  caches.set(key, { data, timestamp: Date.now(), ttl });
}

export function invalidateCache(key) {
  caches.delete(key);
}

export function invalidateAll() {
  caches.clear();
}
