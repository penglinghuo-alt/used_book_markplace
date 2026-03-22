/**
 * 日志配置文件
 * 使用 Winston 库实现结构化日志记录
 * 
 * 功能说明：
 * - 支持不同级别的日志（error, warn, info, http, debug）
 * - 支持将日志输出到控制台和文件
 * - 日志文件按日期自动分割
 * - 不同环境使用不同的日志级别
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// 获取当前环境，默认为开发环境
const nodeEnv = process.env.NODE_ENV || 'development';

// 定义日志格式
// 包含时间戳、日志级别、消息和可选的元数据
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),  // 时间戳格式
    winston.format.errors({ stack: true }),                         // 记录错误堆栈
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        // 自定义日志输出格式
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        // 如果有额外的元数据，添加到日志中
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        
        // 如果有错误堆栈，添加到日志中
        if (stack) {
            log += `\n${stack}`;
        }
        
        return log;
    })
);

// 定义控制台输出格式（带颜色）
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),  // 为日志级别添加颜色
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        if (stack) {
            log += `\n${stack}`;
        }
        return log;
    })
);

// 根据环境确定日志级别
// 生产环境只记录 info 以上级别，开发环境记录 debug 以上
const level = nodeEnv === 'production' ? 'info' : 'debug';

// 创建 Winston 日志记录器实例
const logger = winston.createLogger({
    level: level,                                                     // 日志级别
    format: logFormat,                                                 // 文件日志格式
    defaultMeta: { service: 'used-book-marketplace' },                 // 默认元数据
    transports: [
        // 错误日志文件 - 只记录 error 级别
        new winston.transports.File({ 
            filename: path.join(logDir, 'error.log'),   // 错误日志路径
            level: 'error',                                            // 只记录错误
            maxsize: 5242880,                                          // 单个文件最大 5MB
            maxFiles: 5                                                // 保留 5 个文件
        }),
        
        // 组合日志文件 - 记录所有级别
        new winston.transports.File({ 
            filename: path.join(logDir, 'combined.log'),  // 组合日志路径
            maxsize: 5242880,                                          // 单个文件最大 5MB
            maxFiles: 5                                                // 保留 5 个文件
        })
    ],
    // 在非生产环境下同时输出到控制台
    exitOnError: false                                                 // 日志记录出错时不退出进程
});

// 如果不是生产环境，添加控制台输出
if (nodeEnv !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat                                          // 控制台日志格式
    }));
}

/**
 * 记录 HTTP 请求的中间件
 * 用于记录所有进入的 HTTP 请求
 */
logger.httpRequest = (req) => {
    logger.http(`${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
    });
};

module.exports = logger;
