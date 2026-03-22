/**
 * 错误处理中间件
 * 统一处理应用程序中的所有错误
 * 
 * 功能说明：
 * - 捕获和处理所有未处理的错误
 * - 根据错误类型返回适当的 HTTP 状态码和响应
 * - 记录错误日志
 * - 区分开发环境和生产环境的错误响应
 */

const logger = require('../config/logger');
const nodeEnv = process.env.NODE_ENV || 'development';

/**
 * 自定义应用程序错误类
 * 用于抛出具有特定状态码和错误消息的业务逻辑错误
 */
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;  // HTTP 状态码
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';  // 错误状态
        this.isOperational = true;     // 标记为可预见的业务错误
        
        // 捕获错误堆栈
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 异步处理包装器
 * 包装异步路由处理函数，自动捕获 Promise 错误
 * 
 * 使用方式：
 * router.get('/path', asyncHandler(async (req, res) => {
 *     // 异步代码
 * }));
 * 
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装后的函数
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * 开发环境错误响应
 * 返回详细的错误信息和堆栈跟踪
 * 
 * @param {Error} err - 错误对象
 * @param {Response} res - 响应对象
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode || 500).json({
        success: false,
        status: err.status || 'error',
        message: err.message,
        error: err,              // 包含完整错误对象
        stack: err.stack         // 包含堆栈跟踪
    });
};

/**
 * 生产环境错误响应
 * 返回简化的错误信息，不暴露内部细节
 * 
 * @param {Error} err - 错误对象
 * @param {Response} res - 响应对象
 */
const sendErrorProd = (err, res) => {
    // 如果是可预见的业务错误（如验证错误）
    if (err.isOperational) {
        res.status(err.statusCode || 500).json({
            success: false,
            status: err.status,
            message: err.message
        });
    } else {
        // 未知错误或编程错误，不向客户端暴露细节
        logger.error('未处理的错误', {
            error: err.message,
            stack: err.stack,
            url: req?.originalUrl,
            method: req?.method
        });
        
        res.status(500).json({
            success: false,
            status: 'error',
            message: '服务器内部错误，请稍后再试'
        });
    }
};

/**
 * 404 Not Found 处理器
 * 处理所有未匹配的路由
 */
const notFoundHandler = (req, res, next) => {
    const err = new AppError(`找不到请求的路径: ${req.originalUrl}`, 404);
    next(err);
};

/**
 * 全局错误处理中间件
 * 必须注册在所有路由之后
 */
const errorHandler = (err, req, res, next) => {
    // 设置默认错误状态码
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    // 记录错误日志
    logger.error('请求错误', {
        method: req.method,
        url: req.originalUrl,
        statusCode: err.statusCode,
        message: err.message,
        stack: nodeEnv === 'development' ? err.stack : undefined,
        userId: req.user?.id
    });
    
    // 根据环境返回不同详细程度的错误响应
    if (nodeEnv === 'production') {
        sendErrorProd(err, res);
    } else {
        sendErrorDev(err, res);
    }
};

/**
 * 处理特定的数据库错误
 * 将 MySQL 错误转换为友好的错误消息
 * 
 * @param {Error} err - 原始错误
 * @returns {Error} 转换后的错误
 */
const handleDBErrors = (err) => {
    // MySQL 重复条目错误
    if (err.code === 'ER_DUP_ENTRY') {
        return new AppError('该数据已存在，请使用不同的值', 400);
    }
    
    // MySQL 外键约束错误
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return new AppError('引用的数据不存在', 400);
    }
    
    // MySQL 数据截断错误
    if (err.code === 'ER_DATA_TOO_LONG') {
        return new AppError('输入的数据过长，请减少内容长度', 400);
    }
    
    return err;
};

/**
 * 全局错误处理中间件（带数据库错误处理）
 */
const globalErrorHandler = (err, req, res, next) => {
    // 处理数据库错误
    err = handleDBErrors(err);
    
    // 调用通用错误处理
    errorHandler(err, req, res, next);
};

module.exports = {
    AppError,
    asyncHandler,
    notFoundHandler,
    errorHandler,
    globalErrorHandler
};
