function sanitizeInput(req, res, next) {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
}

function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => {
                if (typeof item === 'string') {
                    return sanitizeString(item);
                }
                return item;
            });
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

function sanitizeString(str) {
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .replace(/<iframe/gi, '')
        .replace(/<embed/gi, '')
        .replace(/<object/gi, '')
        .trim();
}

function validateContentType(req, res, next) {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.headers['content-type'];
        const hasBody = Object.keys(req.body || {}).length > 0;
        
        if (hasBody) {
            if (!contentType || !contentType.includes('application/json')) {
                if (req.headers['content-type'] !== 'multipart/form-data' && 
                    req.headers['content-type'] !== 'application/x-www-form-urlencoded') {
                    return res.status(415).json({
                        success: false,
                        message: '不支持的Content-Type'
                    });
                }
            }
        }
    }
    next();
}

module.exports = { sanitizeInput, sanitizeString, validateContentType };
