// Simple in-memory cache with TTL support
class MemoryCache {
    constructor() {
        this.cache = new Map();
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        const { value, expiresAt } = entry;
        if (expiresAt && Date.now() > expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return value;
    }

    set(key, value, ttlMs = 60000) {
        const expiresAt = ttlMs ? Date.now() + ttlMs : null;
        this.cache.set(key, { value, expiresAt });
    }

    del(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }
}

module.exports = new MemoryCache();
