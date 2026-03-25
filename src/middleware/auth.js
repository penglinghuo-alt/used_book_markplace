/**
 * 认证中间件
 * 负责处理 JWT 令牌验证和用户身份认证
 * 
 * 功能说明：
 * - 验证请求头中的 JWT 令牌
 * - 验证通过后将用户信息附加到请求对象
 * - 保护需要登录才能访问的路由
 */

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const User = require('../models/User');

// 从环境变量获取 JWT 密钥（必须设置）
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable must be set for security');
}

// JWT 过期时间（生产环境应缩短）
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * 用户认证中间件
 * 验证请求头中的 Bearer Token
 * 
 * 使用方式：
 * router.get('/profile', authMiddleware, controller);
 * 
 * 验证成功后，会在 req.user 中附加用户信息
 */
const auth = async (req, res, next) => {
    try {
        // 从请求头获取 Token
        // 格式: Authorization: Bearer <token>
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌'
            });
        }
        
        // 检查 Bearer 格式
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                message: '令牌格式错误，请使用 Bearer <token>'
            });
        }
        
        const token = parts[1];
        
        // 验证 Token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: '令牌已过期'
                });
            }
            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: '无效的令牌'
                });
            }
            throw err;
        }
        
        // 从数据库获取用户信息，确保用户仍然存在
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 将用户信息附加到请求对象
        req.user = {
            id: user.id,
            username: user.username
        };
        
        logger.debug(`用户认证成功`, { userId: user.id, username: user.username });
        
        next();
    } catch (error) {
        logger.error('认证中间件错误', { error: error.message });
        return res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 可选的认证中间件
 * 如果请求中有 Token 则验证，没有则跳过
 * 
 * 适用于那些登录和未登录用户都可以访问的路由
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            req.user = null;
            return next();
        }
        
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            req.user = null;
            return next();
        }
        
        const token = parts[1];
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId);
            
            if (user) {
                req.user = {
                    id: user.id,
                    username: user.username
                };
            } else {
                req.user = null;
            }
        } catch (err) {
            req.user = null;
        }
        
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

/**
 * 生成 JWT 令牌
 * @param {Object} payload - 令牌载荷，包含用户ID
 * @returns {string} JWT 令牌
 */
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
};

/**
 * 验证用户是否是资源的拥有者
 * 用于检查用户是否有权操作某个资源
 * 
 * @param {Function} getResourceUserId - 获取资源拥有者ID的函数
 * @returns {Function} 中间件函数
 */
const ownerAuth = (getResourceUserId) => {
    return async (req, res, next) => {
        try {
            const resourceUserId = await getResourceUserId(req);
            
            if (resourceUserId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: '您没有权限操作此资源'
                });
            }
            
            next();
        } catch (error) {
            logger.error('拥有者验证中间件错误', { error: error.message });
            return res.status(500).json({
                success: false,
                message: '服务器内部错误'
            });
        }
    };
};

module.exports = {
    auth,
    optionalAuth,
    generateToken,
    ownerAuth
};
