const NodeCache = require('node-cache');

// Default TTL: 5 minutes, check period: 10 minutes
const cache = new NodeCache({ stdTTL: 300, checkperiod: 600, useClones: false });

module.exports = {
  get: (key) => cache.get(key),
  set: (key, value, ttl) => ttl ? cache.set(key, value, ttl) : cache.set(key, value),
  del: (key) => cache.del(key),
  flush: () => cache.flushAll(),
  keys: () => cache.keys(),
  // Invalidate all keys with a given prefix
  delByPrefix: (prefix) => {
    const keys = cache.keys().filter((k) => k.startsWith(prefix));
    keys.forEach((k) => cache.del(k));
  },
};
