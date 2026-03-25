function securityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://cdn.jsdelivr.net; font-src 'self' data:; connect-src 'self' https://*; frame-ancestors 'none'");
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-Download-Options', 'noopen');
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    next();
}

function botDetector(req, res, next) {
    const userAgent = req.headers['user-agent'] || '';
    
    const botPatterns = [
        /bot/i, /crawler/i, /spider/i, /scraper/i,
        /curl/i, /wget/i, /python-requests/i,
        /java\//i, /go-http/i, /ruby/i, /node-fetch/i
    ];
    
    const hasBotPattern = botPatterns.some(pattern => pattern.test(userAgent));
    
    if (hasBotPattern && req.method === 'GET') {
        res.setHeader('X-Bot-Detected', 'true');
    }
    
    next();
}

function corsOptions(req, res, next) {
    const allowedOrigins = [
        'http://120.24.189.110',
        'http://xiaoyuanshu.cn',
        'https://120.24.189.110',
        'https://xiaoyuanshu.cn'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    
    next();
}

module.exports = { securityHeaders, botDetector, corsOptions };
