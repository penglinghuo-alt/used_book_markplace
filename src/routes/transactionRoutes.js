/**
 * 交易路由
 * 定义与交易记录相关的 API 路由
 * 
 * 路由前缀: /api/transactions
 */

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { auth } = require('../middleware/auth');
const {
    validate,
    createTransactionValidation,
    idParamValidation,
    paginationValidation
} = require('../middleware/validation');

/**
 * @route   POST /api/transactions
 * @desc    创建交易记录（卖家确认已售出）
 * @access  需要认证（卖家）
 * 
 * 请求体：
 * {
 *   "book_id": 123,    // 书籍ID
 *   "buyer_id": 456    // 买家ID
 * }
 */
router.post(
    '/',
    auth,
    validate(createTransactionValidation),
    transactionController.createTransaction
);

/**
 * @route   GET /api/transactions
 * @desc    获取当前用户的交易记录
 * @access  需要认证
 * 
 * 查询参数：
 * - page: 页码
 * - limit: 每页数量
 * - role: 角色筛选（buyer/seller）
 */
router.get(
    '/',
    auth,
    validate(paginationValidation),
    transactionController.getUserTransactions
);

/**
 * @route   GET /api/transactions/stats
 * @desc    获取当前用户的销售统计
 * @access  需要认证
 */
router.get(
    '/stats',
    auth,
    transactionController.getMyStats
);

/**
 * @route   GET /api/transactions/all
 * @desc    获取所有交易记录（管理员）
 * @access  需要认证
 * 
 * 查询参数：
 * - page: 页码
 * - limit: 每页数量
 */
router.get(
    '/all',
    auth,
    validate(paginationValidation),
    transactionController.getAllTransactions
);

/**
 * @route   GET /api/transactions/all/stats
 * @desc    获取全局销售统计
 * @access  需要认证
 */
router.get(
    '/all/stats',
    auth,
    transactionController.getAllStats
);

/**
 * @route   GET /api/transactions/book/:bookId
 * @desc    根据书籍ID获取交易记录
 * @access  需要认证
 */
router.get(
    '/book/:bookId',
    auth,
    transactionController.getTransactionByBookId
);

/**
 * @route   GET /api/transactions/:id
 * @desc    获取单条交易记录详情
 * @access  需要认证（买家或卖家）
 */
router.get(
    '/:id',
    auth,
    validate(idParamValidation),
    transactionController.getTransactionById
);

module.exports = router;
