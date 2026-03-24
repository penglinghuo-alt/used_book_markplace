const rateLimitStore = new Map();

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 100;

function cleanupExpiredEntries() {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
        if (now - value.windowStart > RATE_LIMIT_WINDOW) {
            rateLimitStore.delete(key);
        }
    }
}

setInterval(cleanupExpiredEntries, RATE_LIMIT_WINDOW);

function rateLimiter(options = {}) {
    const windowMs = options.windowMs || RATE_LIMIT_WINDOW;
    const maxRequests = options.maxRequests || MAX_REQUESTS_PER_WINDOW;
    const message = options.message || '请求过于频繁，请稍后再试';

    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const key = `rate_limit:${ip}`;
        
        const now = Date.now();
        let record = rateLimitStore.get(key);

        if (!record || now - record.windowStart > windowMs) {
            record = {
                windowStart: now,
                count: 1
            };
            rateLimitStore.set(key, record);
        } else {
            record.count++;
        }

        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));

        if (record.count > maxRequests) {
            return res.status(429).json({
                success: false,
                message: message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        next();
    };
}

function strictRateLimiter(options = {}) {
    const windowMs = options.windowMs || 60 * 1000;
    const maxRequests = options.maxRequests || 10;

    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const key = `strict_rate_limit:${ip}:${req.path}`;
        
        const now = Date.now();
        let record = rateLimitStore.get(key);

        if (!record || now - record.windowStart > windowMs) {
            record = {
                windowStart: now,
                count: 1
            };
            rateLimitStore.set(key, record);
        } else {
            record.count++;
        }

        if (record.count > maxRequests) {
            return res.status(429).json({
                success: false,
                message: '操作过于频繁，请稍后重试'
            });
        }

        next();
    };
}

module.exports = { rateLimiter, strictRateLimiter };
