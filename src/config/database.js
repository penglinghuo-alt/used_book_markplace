/**
 * 数据库配置文件
 * 负责创建和管理 MySQL 数据库连接池
 * 
 * 功能说明：
 * - 使用 mysql2 库创建连接池，支持Promise异步操作
 * - 连接池可以高效处理多个并发数据库请求
 * - 所有数据库操作都通过这个模块进行
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// 从环境变量中获取数据库配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',      // 数据库主机地址
    port: parseInt(process.env.DB_PORT) || 3306,  // 数据库端口号
    user: process.env.DB_USER || 'root',           // 数据库用户名
    password: process.env.DB_PASSWORD || '',       // 数据库密码
    database: process.env.DB_NAME || 'used_book_marketplace', // 数据库名称
    waitForConnections: true,                     // 连接池满时是否等待
    connectionLimit: 10,                           // 最大连接数
    queueLimit: 0,                                // 队列限制，0表示无限制
    timezone: '+08:00',                           // 设置时区为中国时区
    charset: 'utf8mb4'                             // 使用 utf8mb4 编码支持更多字符
};

/**
 * 创建数据库连接池
 * 使用 Promise 池可以直接使用 async/await 而不需要回调
 */
const pool = mysql.createPool(dbConfig);

/**
 * 测试数据库连接
 * 用于验证数据库连接是否成功
 */
async function testConnection() {
    try {
        // 从连接池获取一个连接
        const connection = await pool.getConnection();
        console.log('✅ 数据库连接成功');
        
        // 释放连接回连接池
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        return false;
    }
}

/**
 * 执行查询的辅助函数
 * @param {string} sql - SQL 查询语句
 * @param {Array} params - 查询参数
 * @returns {Promise<Array>} 查询结果数组
 */
async function query(sql, params = []) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('数据库查询错误:', error.message);
        throw error;
    }
}

/**
 * 执行插入操作并返回插入的ID
 * @param {string} sql - SQL 插入语句
 * @param {Array} params - 插入参数
 * @returns {Promise<number>} 插入的行ID
 */
async function insert(sql, params = []) {
    try {
        const [result] = await pool.execute(sql, params);
        return result.insertId;
    } catch (error) {
        console.error('数据库插入错误:', error.message);
        throw error;
    }
}

/**
 * 执行更新/删除操作
 * @param {string} sql - SQL 更新/删除语句
 * @param {Array} params - 操作参数
 * @returns {Promise<number>} 受影响的行数
 */
async function execute(sql, params = []) {
    try {
        const [result] = await pool.execute(sql, params);
        return result.affectedRows;
    } catch (error) {
        console.error('数据库操作错误:', error.message);
        throw error;
    }
}

/**
 * 初始化数据库表结构
 * 创建项目所需的所有数据表
 */
async function initializeDatabase() {
    const createUserTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
            username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
            password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希值',
            bio VARCHAR(255) DEFAULT '' COMMENT '个性签名',
            wechat_id VARCHAR(100) DEFAULT NULL COMMENT '微信联系方式',
            avatar_url VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
            INDEX idx_username (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表'
    `;

    const createBookTable = `
        CREATE TABLE IF NOT EXISTS books (
            id INT AUTO_INCREMENT PRIMARY KEY COMMENT '书籍ID',
            seller_id INT NOT NULL COMMENT '卖家ID',
            title VARCHAR(200) NOT NULL COMMENT '书名',
            author VARCHAR(100) NOT NULL COMMENT '作者',
            price DECIMAL(10, 2) NOT NULL COMMENT '价格',
            description TEXT COMMENT '描述/新旧程度',
            status ENUM('active', 'sold') DEFAULT 'active' COMMENT '状态: active=挂售中, sold=已售出',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '挂售时间',
            INDEX idx_seller_id (seller_id),
            INDEX idx_status (status),
            FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='书籍/挂售表'
    `;

    const createMessageTable = `
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
            sender_id INT NOT NULL COMMENT '发送者ID',
            receiver_id INT NOT NULL COMMENT '接收者ID',
            book_id INT DEFAULT NULL COMMENT '关联的书籍ID(可选)',
            content TEXT NOT NULL COMMENT '消息内容',
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
            INDEX idx_sender_id (sender_id),
            INDEX idx_receiver_id (receiver_id),
            INDEX idx_book_id (book_id),
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='私信表'
    `;

    const createTransactionTable = `
        CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY COMMENT '交易ID',
            book_id INT NOT NULL COMMENT '书籍ID',
            buyer_id INT NOT NULL COMMENT '买家ID',
            seller_id INT NOT NULL COMMENT '卖家ID',
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '完成时间',
            INDEX idx_book_id (book_id),
            INDEX idx_buyer_id (buyer_id),
            INDEX idx_seller_id (seller_id),
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='交易记录表'
    `;

    try {
        console.log('📦 正在初始化数据库表...');
        await query(createUserTable);
        console.log('✅ users 表创建成功');
        
        try {
            await query("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) DEFAULT NULL COMMENT '头像URL' AFTER wechat_id");
            console.log('✅ users 表 avatar_url 列添加成功');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ avatar_url 列已存在或无需添加');
            }
        }
        
        await query(createBookTable);
        console.log('✅ books 表创建成功');
        
        await query(createMessageTable);
        console.log('✅ messages 表创建成功');
        
        await query(createTransactionTable);
        console.log('✅ transactions 表创建成功');
        
        console.log('🎉 数据库初始化完成!');
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error.message);
        throw error;
    }
}

// 导出模块
module.exports = {
    pool,
    query,
    insert,
    execute,
    testConnection,
    initializeDatabase
};
