/**
 * 浏览历史相关路由
 * 处理用户浏览书籍历史的 API 请求
 */

const express = require('express');
const router = express.Router();
const BrowseHistory = require('../models/BrowseHistory');
const { auth } = require('../middleware/auth');

/**
 * POST /api/browse-history/:bookId
 * 添加浏览记录（浏览书籍时调用）
 */
router.post('/:bookId', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const bookId = parseInt(req.params.bookId);

        const result = await BrowseHistory.addRecord(userId, bookId);
        
        res.status(201).json({
            success: true,
            message: '浏览记录已添加',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/browse-history
 * 获取当前用户的浏览历史
 */
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        
        const history = await BrowseHistory.getHistory(userId, limit);
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/browse-history/count
 * 获取当前用户的浏览历史数量
 */
router.get('/count', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await BrowseHistory.getHistoryCount(userId);
        
        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * DELETE /api/browse-history
 * 清空当前用户的浏览历史
 */
router.delete('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        await BrowseHistory.clearHistory(userId);
        
        res.json({
            success: true,
            message: '浏览历史已清空'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * DELETE /api/browse-history/:bookId
 * 删除单条浏览记录
 */
router.delete('/:bookId', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const bookId = parseInt(req.params.bookId);
        
        const result = await BrowseHistory.deleteRecord(userId, bookId);
        
        res.json({
            success: result,
            message: result ? '浏览记录已删除' : '浏览记录不存在'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
