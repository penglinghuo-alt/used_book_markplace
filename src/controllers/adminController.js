/**
 * 管理员控制器
 * 处理超级管理员相关的 HTTP 请求
 */

const crypto = require('crypto');
const db = require('../config/database');
const User = require('../models/User');
const Book = require('../models/Book');
const logger = require('../config/logger');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * 管理员登录（使用卡密）
 * POST /api/admin/login
 */
const adminLogin = asyncHandler(async (req, res) => {
    const { cardKey } = req.body;
    
    if (!cardKey || cardKey.length !== 64) {
        throw new AppError('卡密格式错误，必须是64位字符', 400);
    }
    
    const sql = 'SELECT * FROM admin_keys WHERE card_key = ?';
    const keys = await db.query(sql, [cardKey]);
    
    if (keys.length === 0) {
        throw new AppError('无效的卡密', 401);
    }
    
    const adminKey = keys[0];
    
    if (adminKey.is_used) {
        throw new AppError('此卡密已被使用', 401);
    }
    
    let user = null;
    if (adminKey.used_by_user_id) {
        user = await User.findById(adminKey.used_by_user_id);
    }
    
    const adminName = adminKey.admin_name || '东方海林';
    const token = crypto.randomBytes(32).toString('hex');
    
    res.json({
        success: true,
        message: '管理员登录成功',
        data: {
            token,
            adminName,
            cardKeyId: adminKey.id
        }
    });
});

/**
 * 获取所有书籍（管理员视图）
 * GET /api/admin/books
 */
const getAllBooks = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;
    const category = req.query.category;
    const search = req.query.search;
    
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const params = [];
    
    if (status) {
        whereClause += ' AND b.status = ?';
        params.push(status);
    }
    
    if (category) {
        whereClause += ' AND b.category = ?';
        params.push(category);
    }
    
    if (search) {
        whereClause += ' AND (b.title LIKE ? OR b.author LIKE ? OR u.username LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const sql = `
        SELECT b.*, u.username as seller_name, u.wechat_id as seller_wechat
        FROM books b
        JOIN users u ON b.seller_id = u.id
        WHERE ${whereClause}
        ORDER BY b.sort_order DESC, b.created_at DESC
        LIMIT ? OFFSET ?
    `;
    
    const books = await db.query(sql, [...params, limit.toString(), offset.toString()]);
    
    const countSql = `SELECT COUNT(*) as total FROM books b WHERE ${whereClause}`;
    const countResult = await db.query(countSql, params);
    const total = countResult[0].total;
    
    res.json({
        success: true,
        data: {
            books,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    });
});

/**
 * 创建书籍（管理员）
 * POST /api/admin/books
 */
const createBook = asyncHandler(async (req, res) => {
    const { seller_id, title, author, price, description, image_url, category } = req.body;
    
    if (!seller_id || !title || !author || !price) {
        throw new AppError('缺少必填字段', 400);
    }
    
    const seller = await User.findById(seller_id);
    if (!seller) {
        throw new AppError('卖家不存在', 404);
    }
    
    const sql = `
        INSERT INTO books (seller_id, title, author, price, description, image_url, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const bookId = await db.insert(sql, [seller_id, title, author, price, description || '', image_url || null, category || 'other']);
    
    logger.info(`管理员创建书籍`, { bookId, title, adminId: req.admin?.id });
    
    res.status(201).json({
        success: true,
        message: '书籍创建成功',
        data: { id: bookId }
    });
});

/**
 * 更新书籍（管理员）
 * PUT /api/admin/books/:id
 */
const updateBook = asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id);
    const { title, author, price, description, image_url, category, status, sort_order } = req.body;
    
    const book = await Book.findById(bookId);
    if (!book) {
        throw new AppError('书籍不存在', 404);
    }
    
    const updates = [];
    const values = [];
    
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (author !== undefined) { updates.push('author = ?'); values.push(author); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (image_url !== undefined) { updates.push('image_url = ?'); values.push(image_url); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }
    
    if (updates.length === 0) {
        throw new AppError('没有要更新的字段', 400);
    }
    
    values.push(bookId);
    const sql = `UPDATE books SET ${updates.join(', ')} WHERE id = ?`;
    await db.execute(sql, values);
    
    logger.info(`管理员更新书籍`, { bookId, updates: req.body, adminId: req.admin?.id });
    
    res.json({
        success: true,
        message: '书籍更新成功'
    });
});

/**
 * 删除书籍（管理员）
 * DELETE /api/admin/books/:id
 */
const deleteBook = asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id);
    
    const book = await Book.findById(bookId);
    if (!book) {
        throw new AppError('书籍不存在', 404);
    }
    
    const sql = 'DELETE FROM books WHERE id = ?';
    await db.execute(sql, [bookId]);
    
    logger.info(`管理员删除书籍`, { bookId, title: book.title, adminId: req.admin?.id });
    
    res.json({
        success: true,
        message: '书籍删除成功'
    });
});

/**
 * 批量更新书籍排序
 * PUT /api/admin/books/reorder
 */
const reorderBooks = asyncHandler(async (req, res) => {
    const { bookOrders } = req.body;
    
    if (!Array.isArray(bookOrders)) {
        throw new AppError('bookOrders 必须是数组', 400);
    }
    
    for (const item of bookOrders) {
        if (typeof item.id !== 'number' || typeof item.sort_order !== 'number') {
            throw new AppError('每个元素必须包含 id 和 sort_order', 400);
        }
        await db.execute('UPDATE books SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
    }
    
    logger.info(`管理员批量更新书籍排序`, { count: bookOrders.length, adminId: req.admin?.id });
    
    res.json({
        success: true,
        message: '排序更新成功'
    });
});

/**
 * 获取所有用户（管理员视图）
 * GET /api/admin/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search;
    
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const params = [];
    
    if (search) {
        whereClause += ' AND (username LIKE ? OR phone LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    
    const sql = `
        SELECT id, username, phone, bio, wechat_id, avatar_url, created_at
        FROM users
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `;
    
    const users = await db.query(sql, [...params, limit.toString(), offset.toString()]);
    
    const countSql = `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`;
    const countResult = await db.query(countSql, params);
    const total = countResult[0].total;
    
    res.json({
        success: true,
        data: {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    });
});

/**
 * 创建用户（管理员）
 * POST /api/admin/users
 */
const createUser = asyncHandler(async (req, res) => {
    const { username, password, phone, bio, wechat_id } = req.body;
    
    if (!username || !password) {
        throw new AppError('用户名和密码不能为空', 400);
    }
    
    const user = await User.create({
        username,
        password,
        phone: phone || null,
        bio: bio || '',
        wechat_id: wechat_id || null
    });
    
    logger.info(`管理员创建用户`, { userId: user.id, username, adminId: req.admin?.id });
    
    res.status(201).json({
        success: true,
        message: '用户创建成功',
        data: { id: user.id, username: user.username }
    });
});

/**
 * 更新用户（管理员）
 * PUT /api/admin/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const { username, phone, bio, wechat_id, password } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('用户不存在', 404);
    }
    
    if (username || phone !== undefined || bio !== undefined || wechat_id !== undefined) {
        await User.update(userId, {
            username,
            bio,
            wechat_id
        });
    }
    
    if (password) {
        await User.updatePassword(userId, password);
    }
    
    logger.info(`管理员更新用户`, { userId, updates: req.body, adminId: req.admin?.id });
    
    res.json({
        success: true,
        message: '用户更新成功'
    });
});

/**
 * 删除用户（管理员）
 * DELETE /api/admin/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('用户不存在', 404);
    }
    
    await User.delete(userId);
    
    logger.info(`管理员删除用户`, { userId, username: user.username, adminId: req.admin?.id });
    
    res.json({
        success: true,
        message: '用户删除成功'
    });
});

/**
 * 获取所有反馈日志
 * GET /api/admin/feedbacks
 */
const getAllFeedbacks = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;
    const logType = req.query.logType;
    
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const params = [];
    
    if (status) {
        whereClause += ' AND f.status = ?';
        params.push(status);
    }
    
    if (logType) {
        whereClause += ' AND f.log_type = ?';
        params.push(logType);
    }
    
    const sql = `
        SELECT f.*, u.username
        FROM feedback_logs f
        JOIN users u ON f.user_id = u.id
        WHERE ${whereClause}
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
    `;
    
    const feedbacks = await db.query(sql, [...params, limit.toString(), offset.toString()]);
    
    const countSql = `SELECT COUNT(*) as total FROM feedback_logs f WHERE ${whereClause}`;
    const countResult = await db.query(countSql, params);
    const total = countResult[0].total;
    
    res.json({
        success: true,
        data: {
            feedbacks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    });
});

/**
 * 回复反馈
 * POST /api/admin/feedbacks/:id/reply
 */
const replyFeedback = asyncHandler(async (req, res) => {
    const feedbackId = parseInt(req.params.id);
    const { reply, status } = req.body;
    
    if (!reply) {
        throw new AppError('回复内容不能为空', 400);
    }
    
    const sql = 'SELECT * FROM feedback_logs WHERE id = ?';
    const feedbacks = await db.query(sql, [feedbackId]);
    
    if (feedbacks.length === 0) {
        throw new AppError('反馈不存在', 404);
    }
    
    const updateStatus = status || 'replied';
    const updateSql = `
        UPDATE feedback_logs 
        SET admin_reply = ?, replied_at = NOW(), replied_by = ?, status = ?
        WHERE id = ?
    `;
    
    await db.execute(updateSql, [reply, '东方海林', updateStatus, feedbackId]);
    
    logger.info(`管理员回复反馈`, { feedbackId, adminId: req.admin?.id });
    
    res.json({
        success: true,
        message: '回复成功'
    });
});

/**
 * 获取统计数据
 * GET /api/admin/stats
 */
const getStats = asyncHandler(async (req, res) => {
    const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
    const booksCount = await db.query('SELECT COUNT(*) as count FROM books WHERE status = "active"');
    const soldBooksCount = await db.query('SELECT COUNT(*) as count FROM books WHERE status = "sold"');
    const feedbacksPending = await db.query('SELECT COUNT(*) as count FROM feedback_logs WHERE status = "pending"');
    
    res.json({
        success: true,
        data: {
            users: usersCount[0].count,
            activeBooks: booksCount[0].count,
            soldBooks: soldBooksCount[0].count,
            pendingFeedbacks: feedbacksPending[0].count
        }
    });
});

module.exports = {
    adminLogin,
    getAllBooks,
    createBook,
    updateBook,
    deleteBook,
    reorderBooks,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getAllFeedbacks,
    replyFeedback,
    getStats
};
