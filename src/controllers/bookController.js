/**
 * 书籍控制器
 * 处理与书籍/挂售相关的 HTTP 请求
 * 
 * 功能说明：
 * - 发布新书籍（挂售）
 * - 获取书籍列表
 * - 获取单本书籍详情
 * - 更新书籍信息
 * - 删除书籍
 */

const Book = require('../models/Book');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

/**
 * 发布新书籍（创建挂售）
 * POST /api/books
 * 需要认证
 * 
 * 请求体：
 * {
 *   "title": "书名",
 *   "author": "作者",
 *   "price": 29.99,
 *   "description": "新旧程度描述"
 * }
 */
const createBook = asyncHandler(async (req, res) => {
    const { title, author, price, description } = req.body;
    
    // 创建书籍
    const book = await Book.create({
        seller_id: req.user.id,  // 从认证中间件获取卖家ID
        title,
        author,
        price,
        description
    });
    
    logger.info(`书籍发布成功`, { bookId: book.id, sellerId: req.user.id });
    
    res.status(201).json({
        success: true,
        message: '书籍发布成功',
        data: {
            book
        }
    });
});

/**
 * 获取所有挂售中的书籍（支持搜索和分页）
 * GET /api/books
 * 
 * 查询参数：
 * - page: 页码（默认1）
 * - limit: 每页数量（默认10）
 * - search: 搜索关键词（书名或作者）
 * - status: 状态筛选（active/sold，默认active）
 */
const getBooks = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || 'active';
    
    const result = await Book.findAll({ page, limit, search, status });
    
    res.status(200).json({
        success: true,
        data: result
    });
});

/**
 * 获取单本书籍详情
 * GET /api/books/:id
 * 
 * 返回书籍信息，包括卖家用户名
 */
const getBookById = asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id);
    
    const book = await Book.findById(bookId);
    
    if (!book) {
        throw new AppError('书籍不存在', 404);
    }
    
    res.status(200).json({
        success: true,
        data: {
            book
        }
    });
});

/**
 * 获取当前用户发布的所有书籍
 * GET /api/books/my
 * 需要认证
 * 
 * 查询参数：
 * - status: 状态筛选（可选）
 */
const getMyBooks = asyncHandler(async (req, res) => {
    const status = req.query.status || null;
    
    const books = await Book.findBySeller(req.user.id, status);
    
    res.status(200).json({
        success: true,
        data: {
            books
        }
    });
});

/**
 * 获取指定卖家发布的所有书籍
 * GET /api/books/seller/:sellerId
 * 
 * 查询参数：
 * - status: 状态筛选（可选）
 */
const getBooksBySeller = asyncHandler(async (req, res) => {
    const sellerId = parseInt(req.params.sellerId);
    const status = req.query.status || null;
    
    const books = await Book.findBySeller(sellerId, status);
    
    res.status(200).json({
        success: true,
        data: {
            books
        }
    });
});

/**
 * 更新书籍信息
 * PUT /api/books/:id
 * 需要认证（仅卖家可以更新）
 * 
 * 请求体（部分更新）：
 * {
 *   "title": "新书名",
 *   "author": "新作者",
 *   "price": 39.99,
 *   "description": "新描述"
 * }
 */
const updateBook = asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id);
    const { title, author, price, description } = req.body;
    
    // 获取书籍信息
    const book = await Book.findById(bookId);
    
    if (!book) {
        throw new AppError('书籍不存在', 404);
    }
    
    // 检查是否是卖家
    if (book.seller_id !== req.user.id) {
        throw new AppError('只有卖家可以更新书籍信息', 403);
    }
    
    // 检查书籍是否已售出
    if (book.status === 'sold') {
        throw new AppError('已售出的书籍无法更新', 400);
    }
    
    // 更新书籍
    const success = await Book.update(bookId, {
        title,
        author,
        price,
        description
    });
    
    if (!success) {
        throw new AppError('没有要更新的内容', 400);
    }
    
    // 获取更新后的书籍信息
    const updatedBook = await Book.findById(bookId);
    
    logger.info(`书籍信息更新`, { bookId, userId: req.user.id });
    
    res.status(200).json({
        success: true,
        message: '书籍信息更新成功',
        data: {
            book: updatedBook
        }
    });
});

/**
 * 删除书籍
 * DELETE /api/books/:id
 * 需要认证（仅卖家可以删除）
 */
const deleteBook = asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id);
    
    // 获取书籍信息
    const book = await Book.findById(bookId);
    
    if (!book) {
        throw new AppError('书籍不存在', 404);
    }
    
    // 检查是否是卖家
    if (book.seller_id !== req.user.id) {
        throw new AppError('只有卖家可以删除书籍', 403);
    }
    
    // 删除书籍（外键级联会处理关联数据）
    const success = await Book.delete(bookId);
    
    if (!success) {
        throw new AppError('删除失败', 500);
    }
    
    logger.info(`书籍删除成功`, { bookId, userId: req.user.id });
    
    res.status(200).json({
        success: true,
        message: '书籍删除成功'
    });
});

/**
 * 更新书籍状态
 * PATCH /api/books/:id/status
 * 需要认证（仅卖家可以更新）
 * 
 * 请求体：
 * {
 *   "status": "active" | "sold"
 * }
 */
const updateBookStatus = asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id);
    const { status, buyer_id } = req.body;
    
    if (!status) {
        throw new AppError('状态不能为空', 400);
    }
    
    if (!['active', 'sold'].includes(status)) {
        throw new AppError('状态必须是 active 或 sold', 400);
    }
    
    const book = await Book.findById(bookId);
    
    if (!book) {
        throw new AppError('书籍不存在', 404);
    }
    
    if (book.seller_id !== req.user.id) {
        throw new AppError('只有卖家可以更新书籍状态', 403);
    }
    
    if (status === 'sold' && !buyer_id) {
        throw new AppError('标记售出时必须指定买家', 400);
    }
    
    const success = await Book.updateStatus(bookId, status, buyer_id ? { buyer_id, seller_id: req.user.id } : null);
    
    if (!success) {
        throw new AppError('状态更新失败', 500);
    }
    
    const updatedBook = await Book.findById(bookId);
    
    logger.info(`书籍状态更新`, { bookId, status, userId: req.user.id, buyer_id });
    
    res.status(200).json({
        success: true,
        message: '书籍状态更新成功',
        data: {
            book: updatedBook
        }
    });
});

module.exports = {
    createBook,
    getBooks,
    getBookById,
    getMyBooks,
    getBooksBySeller,
    updateBook,
    deleteBook,
    updateBookStatus
};
