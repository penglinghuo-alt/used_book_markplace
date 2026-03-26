const logger = require('../config/logger');

const ipRegistrationStore = new Map();
const usernameStore = new Map();
const ipCooldownStore = new Map();

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REGISTRATIONS_PER_IP = 5;
const REGISTRATION_COOLDOWN = 30 * 60 * 1000;

const USERNAME_BLACKLIST = [
    'admin', 'root', 'system', 'administrator', 'moderator',
    'user', 'users', 'guest', 'test', 'testing',
    'null', 'undefined', 'void', 'none',
    'book', 'books', 'market', 'seller', 'buyer',
    'manager', 'operator', 'owner', 'master',
    'super', 'superuser', 'superman', 'admin123', 'admin888',
    'test123', 'guest123', 'root123', 'password', 'pass123',
    '111111', '123456', '12345678', 'abcdef', 'qwerty'
];

function isBlacklistUsername(username) {
    const lowerUsername = username.toLowerCase();
    return USERNAME_BLACKLIST.some(blocked => 
        lowerUsername === blocked || 
        lowerUsername.includes(blocked)
    );
}

function checkIpRegistrationLimit(ip) {
    const now = Date.now();
    const key = `ip:${ip}`;
    
    let record = ipRegistrationStore.get(key);
    
    if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
        record = {
            windowStart: now,
            count: 1
        };
        ipRegistrationStore.set(key, record);
        return { allowed: true, remaining: MAX_REGISTRATIONS_PER_IP - 1 };
    }
    
    record.count++;
    
    if (record.count > MAX_REGISTRATIONS_PER_IP) {
        logger.warn(`IP注册频率超限`, { ip, count: record.count });
        return { 
            allowed: false, 
            remaining: 0,
            retryAfter: Math.ceil((record.windowStart + RATE_LIMIT_WINDOW - now) / 1000)
        };
    }
    
    return { allowed: true, remaining: MAX_REGISTRATIONS_PER_IP - record.count };
}

function checkIpCooldown(ip) {
    const key = `cooldown:${ip}`;
    const cooldownRecord = ipCooldownStore.get(key);
    
    if (cooldownRecord) {
        const now = Date.now();
        const cooldownRemaining = cooldownRecord.endTime - now;
        
        if (cooldownRemaining > 0) {
            return {
                blocked: true,
                remainingMs: cooldownRemaining,
                retryAfter: Math.ceil(cooldownRemaining / 1000)
            };
        } else {
            ipCooldownStore.delete(key);
        }
    }
    
    return { blocked: false };
}

function setIpCooldown(ip, durationMs = REGISTRATION_COOLDOWN) {
    const key = `cooldown:${ip}`;
    ipCooldownStore.set(key, {
        startTime: Date.now(),
        endTime: Date.now() + durationMs,
        registrations: 1
    });
}

function recordSuccessfulRegistration(ip, username) {
    const cooldownKey = `cooldown:${ip}`;
    const cooldownRecord = ipCooldownStore.get(cooldownKey);
    
    if (cooldownRecord) {
        cooldownRecord.registrations = (cooldownRecord.registrations || 0) + 1;
        
        if (cooldownRecord.registrations >= 3) {
            cooldownRecord.endTime = Date.now() + REGISTRATION_COOLDOWN;
            logger.info(`IP频繁注册，设置冷却时间`, { 
                ip, 
                registrations: cooldownRecord.registrations 
            });
        }
    }
    
    const usernameKey = `username:${username.toLowerCase()}`;
    usernameStore.set(usernameKey, {
        username,
        ip,
        timestamp: Date.now()
    });
}

function isRecentUsername(username, ip) {
    const key = `username:${username.toLowerCase()}`;
    const record = usernameStore.get(key);
    
    if (record && record.ip === ip) {
        const now = Date.now();
        if (now - record.timestamp < 60000) {
            return true;
        }
    }
    
    return false;
}

setInterval(() => {
    const now = Date.now();
    
    for (const [key, record] of ipRegistrationStore.entries()) {
        if (now - record.windowStart > RATE_LIMIT_WINDOW * 2) {
            ipRegistrationStore.delete(key);
        }
    }
    
    for (const [key, record] of ipCooldownStore.entries()) {
        if (now - record.endTime > 60000) {
            ipCooldownStore.delete(key);
        }
    }
    
    for (const [key, record] of usernameStore.entries()) {
        if (now - record.timestamp > 60000) {
            usernameStore.delete(key);
        }
    }
}, 60000);

function ipRegistrationLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    const cooldownCheck = checkIpCooldown(ip);
    if (cooldownCheck.blocked) {
        return res.status(429).json({
            success: false,
            message: `注册过于频繁，请${Math.ceil(cooldownCheck.retryAfter / 60)}分钟后再试`,
            retryAfter: cooldownCheck.retryAfter
        });
    }
    
    const limitCheck = checkIpRegistrationLimit(ip);
    if (!limitCheck.allowed) {
        return res.status(429).json({
            success: false,
            message: `该IP注册次数过多，请稍后再试`,
            retryAfter: limitCheck.retryAfter
        });
    }
    
    res.setHeader('X-Registration-Limit', MAX_REGISTRATIONS_PER_IP);
    res.setHeader('X-Registration-Remaining', limitCheck.remaining);
    
    next();
}

function usernameBlacklistChecker(req, res, next) {
    const { username } = req.body;
    
    if (!username) {
        return next();
    }
    
    if (isBlacklistUsername(username)) {
        logger.warn(`尝试注册黑名单用户名`, { 
            username, 
            ip: req.ip 
        });
        return res.status(400).json({
            success: false,
            message: '该用户名不可用，请选择其他用户名'
        });
    }
    
    next();
}

function usernameRegistrationHistory(req, res, next) {
    const { username } = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (!username) {
        return next();
    }
    
    if (isRecentUsername(username, ip)) {
        return res.status(429).json({
            success: false,
            message: '该用户名刚刚已被注册，请选择其他用户名'
        });
    }
    
    next();
}

function recordRegistration(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const { username } = req.body;
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
        recordSuccessfulRegistration(ip, username);
    }
    
    next();
}

module.exports = {
    ipRegistrationLimiter,
    usernameBlacklistChecker,
    usernameRegistrationHistory,
    recordRegistration,
    isBlacklistUsername,
    MAX_REGISTRATIONS_PER_IP,
    REGISTRATION_COOLDOWN
};