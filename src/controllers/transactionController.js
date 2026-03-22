/**
 * 交易控制器
 * 处理与交易记录相关的 HTTP 请求
 * 
 * 功能说明：
 * - 创建交易记录（卖家确认已售出）
 * - 获取交易记录
 * - 获取销售统计
 */

const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

/**
 * 创建交易记录（卖家确认已售出）
 * POST /api/transactions
 * 需要认证（卖家身份）
 * 
 * 请求体：
 * {
 *   "book_id": 123,    // 书籍ID
 *   "buyer_id": 456    // 买家用户ID
 * }
 * 
 * 注意：
 * - 只有书籍卖家才能执行此操作
 * - 书籍状态会自动变为 'sold'
 * - 会同时更新书籍状态
 */
const createTransaction = asyncHandler(async (req, res) => {
    const { book_id, buyer_id } = req.body;
    
    // 获取书籍信息进行验证
    const book = await Book.findById(book_id);
    
    if (!book) {
        throw new AppError('书籍不存在', 404);
    }
    
    // 检查是否是卖家操作
    if (book.seller_id !== req.user.id) {
        throw new AppError('只有卖家才能确认交易', 403);
    }
    
    // 检查书籍是否已售出
    if (book.status === 'sold') {
        throw new AppError('该书籍已经售出', 400);
    }
    
    // 创建交易记录（会同时更新书籍状态）
    const transaction = await Transaction.create({
        book_id,
        buyer_id,
        seller_id: req.user.id
    });
    
    logger.info(`交易记录创建成功`, { 
        transactionId: transaction.id, 
        bookId: book_id, 
        buyerId: buyer_id, 
        sellerId: req.user.id 
    });
    
    res.status(201).json({
        success: true,
        message: '交易记录创建成功',
        data: {
            transaction
        }
    });
});

/**
 * 获取当前用户的交易记录
 * GET /api/transactions
 * 需要认证
 * 
 * 查询参数：
 * - page: 页码（默认1）
 * - limit: 每页数量（默认10）
 * - role: 筛选角色（buyer/seller，可选）
 */
const getUserTransactions = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role || null;
    
    // 验证角色参数
    if (role && !['buyer', 'seller'].includes(role)) {
        throw new AppError('role 参数必须是 buyer 或 seller', 400);
    }
    
    const result = await Transaction.findByUser(req.user.id, role, { page, limit });
    
    res.status(200).json({
        success: true,
        data: result
    });
});

/**
 * 获取单条交易记录详情
 * GET /api/transactions/:id
 * 需要认证（交易买家或卖家）
 */
const getTransactionById = asyncHandler(async (req, res) => {
    const transactionId = parseInt(req.params.id);
    
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
        throw new AppError('交易记录不存在', 404);
    }
    
    // 检查权限（只有买家或卖家可以查看）
    if (transaction.buyer_id !== req.user.id && transaction.seller_id !== req.user.id) {
        throw new AppError('您没有权限查看此交易记录', 403);
    }
    
    res.status(200).json({
        success: true,
        data: {
            transaction
        }
    });
});

/**
 * 根据书籍ID获取交易记录
 * GET /api/transactions/book/:bookId
 * 需要认证（交易买家或卖家）
 */
const getTransactionByBookId = asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.bookId);
    
    // 获取书籍信息
    const book = await Book.findById(bookId);
    
    if (!book) {
        throw new AppError('书籍不存在', 404);
    }
    
    const transaction = await Transaction.findByBookId(bookId);
    
    if (!transaction) {
        throw new AppError('该书籍暂无交易记录', 404);
    }
    
    // 检查权限
    if (transaction.buyer_id !== req.user.id && transaction.seller_id !== req.user.id) {
        throw new AppError('您没有权限查看此交易记录', 403);
    }
    
    res.status(200).json({
        success: true,
        data: {
            transaction
        }
    });
});

/**
 * 获取当前用户的销售统计
 * GET /api/transactions/stats
 * 需要认证
 * 
 * 返回作为卖家的销售统计信息
 */
const getMyStats = asyncHandler(async (req, res) => {
    const stats = await Transaction.getStatistics(req.user.id);
    
    res.status(200).json({
        success: true,
        data: {
            stats: {
                total_transactions: parseInt(stats.total_transactions) || 0,
                total_revenue: parseFloat(stats.total_revenue) || 0,
                sellers_count: parseInt(stats.sellers_count) || 0,
                buyers_count: parseInt(stats.buyers_count) || 0
            }
        }
    });
});

/**
 * 获取全局销售统计（管理员用）
 * GET /api/transactions/all/stats
 * 需要认证
 */
const getAllStats = asyncHandler(async (req, res) => {
    const stats = await Transaction.getStatistics();
    
    res.status(200).json({
        success: true,
        data: {
            stats: {
                total_transactions: parseInt(stats.total_transactions) || 0,
                total_revenue: parseFloat(stats.total_revenue) || 0,
                sellers_count: parseInt(stats.sellers_count) || 0,
                buyers_count: parseInt(stats.buyers_count) || 0
            }
        }
    });
});

/**
 * 获取所有交易记录（管理员用）
 * GET /api/transactions/all
 * 需要认证
 * 
 * 查询参数：
 * - page: 页码（默认1）
 * - limit: 每页数量（默认10）
 */
const getAllTransactions = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await Transaction.findAll({ page, limit });
    
    res.status(200).json({
        success: true,
        data: result
    });
});

module.exports = {
    createTransaction,
    getUserTransactions,
    getTransactionById,
    getTransactionByBookId,
    getMyStats,
    getAllStats,
    getAllTransactions
};
