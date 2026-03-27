/**
 * 管理员路由
 * 定义与管理员相关的 API 路由
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminAuth } = require('../middleware/adminAuth');

/**
 * @route   POST /api/admin/login
 * @desc    管理员登录（使用卡密）
 * @access  公开
 */
router.post('/login', adminController.adminLogin);

/**
 * @route   GET /api/admin/stats
 * @desc    获取统计数据
 * @access  需要管理员认证
 */
router.get('/stats', adminAuth, adminController.getStats);

/**
 * @route   GET /api/admin/books
 * @desc    获取所有书籍（管理员视图）
 * @access  需要管理员认证
 */
router.get('/books', adminAuth, adminController.getAllBooks);

/**
 * @route   POST /api/admin/books
 * @desc    创建书籍（管理员）
 * @access  需要管理员认证
 */
router.post('/books', adminAuth, adminController.createBook);

/**
 * @route   PUT /api/admin/books/reorder
 * @desc    批量更新书籍排序
 * @access  需要管理员认证
 */
router.put('/books/reorder', adminAuth, adminController.reorderBooks);

/**
 * @route   PUT /api/admin/books/:id
 * @desc    更新书籍（管理员）
 * @access  需要管理员认证
 */
router.put('/books/:id', adminAuth, adminController.updateBook);

/**
 * @route   DELETE /api/admin/books/:id
 * @desc    删除书籍（管理员）
 * @access  需要管理员认证
 */
router.delete('/books/:id', adminAuth, adminController.deleteBook);

/**
 * @route   GET /api/admin/users
 * @desc    获取所有用户（管理员视图）
 * @access  需要管理员认证
 */
router.get('/users', adminAuth, adminController.getAllUsers);

/**
 * @route   POST /api/admin/users
 * @desc    创建用户（管理员）
 * @access  需要管理员认证
 */
router.post('/users', adminAuth, adminController.createUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    更新用户（管理员）
 * @access  需要管理员认证
 */
router.put('/users/:id', adminAuth, adminController.updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    删除用户（管理员）
 * @access  需要管理员认证
 */
router.delete('/users/:id', adminAuth, adminController.deleteUser);

/**
 * @route   GET /api/admin/feedbacks
 * @desc    获取所有反馈日志
 * @access  需要管理员认证
 */
router.get('/feedbacks', adminAuth, adminController.getAllFeedbacks);

/**
 * @route   POST /api/admin/feedbacks/:id/reply
 * @desc    回复反馈
 * @access  需要管理员认证
 */
router.post('/feedbacks/:id/reply', adminAuth, adminController.replyFeedback);

module.exports = router;
