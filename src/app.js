/**
 * 应用入口文件
 * 配置 Express 应用，连接数据库，启动服务器
 */

const express = require('express');
require('dotenv').config();

const logger = require('./config/logger');
const db = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 创建 Express 应用实例
const app = express();

// ==================== 中间件配置 ====================

/**
 * 解析 JSON 请求体
 * 必须在路由配置之前设置
 */
app.use(express.json({ limit: '10mb' }));

/**
 * 解析 URL-encoded 请求体
 * 用于处理表单提交
 */
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * CORS 中间件
 * 允许跨域请求
 */
app.use((req, res, next) => {
    // 允许所有来源访问（生产环境应该限制）
    res.header('Access-Control-Allow-Origin', '*');
    // 允许的 HTTP 方法
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    // 允许的请求头
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

/**
 * 请求日志中间件
 * 记录所有进入的请求
 */
app.use((req, res, next) => {
    const start = Date.now();
    
    // 请求结束时记录日志
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`请求完成`, {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        });
    });
    
    next();
});

// ==================== 路由配置 ====================

/**
 * API 路由
 * 所有 API 请求都通过 /api 前缀访问
 */
app.use('/api', routes);

// ==================== 静态文件服务 ====================

app.use('/uploads', express.static('uploads'));

/**
 * 如果需要提供静态文件服务（如上传的图片），可以取消注释下面的代码
 * 并将上传的文件放在 public 目录下
 */
// app.use('/static', express.static('public'));

// ==================== 错误处理 ====================

/**
 * 404 处理
 * 处理所有未匹配的路由
 */
app.use(notFoundHandler);

/**
 * 全局错误处理
 * 必须放在所有路由之后
 */
app.use(errorHandler);

// ==================== 服务器启动 ====================

/**
 * 获取端口号
 * 优先使用环境变量，否则使用默认值 3000
 */
const PORT = process.env.PORT || 3000;

/**
 * 启动服务器
 * 先测试数据库连接，再初始化表结构，最后启动监听
 */
async function startServer() {
    try {
        // 1. 测试数据库连接
        logger.info('正在连接数据库...');
        const dbConnected = await db.testConnection();
        
        if (!dbConnected) {
            logger.error('数据库连接失败，请检查配置');
            process.exit(1);
        }
        
        // 2. 初始化数据库表结构
        logger.info('正在初始化数据库表...');
        await db.initializeDatabase();
        
        // 3. 启动 HTTP 服务器
        app.listen(PORT, () => {
            logger.info(`🚀 服务器启动成功`, {
                port: PORT,
                env: process.env.NODE_ENV || 'development',
                url: `http://localhost:${PORT}/api`
            });
            
            // 输出可用路由提示
            logger.info('📚 可用的 API 路由:', {
                health: `http://localhost:${PORT}/api/health`,
                users: `http://localhost:${PORT}/api/users`,
                books: `http://localhost:${PORT}/api/books`,
                messages: `http://localhost:${PORT}/api/messages`,
                transactions: `http://localhost:${PORT}/api/transactions`
            });
        });
        
    } catch (error) {
        logger.error('服务器启动失败', { error: error.message, stack: error.stack });
        process.exit(1);
    }
}

/**
 * 处理未捕获的 Promise 异常
 */
process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的 Promise 异常', { reason, promise });
});

/**
 * 处理未捕获的异常
 */
process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常', { error: error.message, stack: error.stack });
    process.exit(1);
});

/**
 * 优雅关闭
 * 当进程收到终止信号时，优雅地关闭服务器
 */
process.on('SIGTERM', async () => {
    logger.info('收到 SIGTERM 信号，正在关闭服务器...');
    
    try {
        // 关闭数据库连接池
        await db.pool.end();
        logger.info('数据库连接已关闭');
        
        process.exit(0);
    } catch (error) {
        logger.error('关闭服务器时出错', { error: error.message });
        process.exit(1);
    }
});

// 启动服务器
startServer();

// 导出 app 实例用于测试
module.exports = app;
