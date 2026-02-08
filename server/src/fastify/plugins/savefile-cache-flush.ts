import fp from "fastify-plugin"

const CACHE_FLUSH_INTERVAL_MS = 2 * 60 * 1000; // Flush every two minutes.

export default fp(async (fastify) => {
    setInterval(() => fastify.state.savefileCache.flush(), CACHE_FLUSH_INTERVAL_MS);
});