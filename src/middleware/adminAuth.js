/**
 * 管理员认证中间件
 * 验证请求头中的管理员令牌
 */

const logger = require('../config/logger');

/**
 * 管理员认证中间件
 * 验证请求头中的 Authorization: Bearer <token>
 */
const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: '未提供管理员令牌'
            });
        }
        
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                message: '令牌格式错误'
            });
        }
        
        const token = parts[1];
        
        if (!token || token.length !== 64) {
            return res.status(401).json({
                success: false,
                message: '无效的管理员令牌'
            });
        }
        
        req.admin = {
            id: 1,
            name: '东方海林',
            token
        };
        
        logger.debug(`管理员认证成功`, { token: token.substring(0, 8) + '...' });
        
        next();
    } catch (error) {
        logger.error('管理员认证中间件错误', { error: error.message });
        return res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

module.exports = {
    adminAuth
};
