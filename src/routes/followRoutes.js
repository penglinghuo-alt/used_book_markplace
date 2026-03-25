/**
 * 关注相关路由
 * 处理用户关注/取消关注的 API 请求
 */

const express = require('express');
const router = express.Router();
const Follow = require('../models/Follow');
const { auth } = require('../middleware/auth');

/**
 * GET /api/follow/following
 * 获取当前用户的关注列表
 */
router.get('/following', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const list = await Follow.getFollowing(userId);
        
        res.json({
            success: true,
            data: list
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/follow/followers
 * 获取当前用户的粉丝列表
 */
router.get('/followers', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const list = await Follow.getFollowers(userId);
        
        res.json({
            success: true,
            data: list
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/follow/counts/:userId
 * 获取指定用户的关注和粉丝数量
 */
router.get('/counts/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: '无效的用户ID'
            });
        }
        const counts = await Follow.getCounts(userId);
        
        res.json({
            success: true,
            data: counts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/follow/status/:userId
 * 检查当前用户是否关注了指定用户
 */
router.get('/status/:userId', auth, async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = parseInt(req.params.userId);
        
        const isFollowing = await Follow.isFollowing(followerId, followingId);
        
        res.json({
            success: true,
            data: { isFollowing }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/follow/:userId
 * 关注用户
 */
router.post('/:userId', auth, async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = parseInt(req.params.userId);

        const result = await Follow.follow(followerId, followingId);
        
        res.status(201).json({
            success: true,
            message: '关注成功',
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
 * DELETE /api/follow/:userId
 * 取消关注
 */
router.delete('/:userId', auth, async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = parseInt(req.params.userId);

        const result = await Follow.unfollow(followerId, followingId);
        
        res.json({
            success: result,
            message: result ? '取消关注成功' : '取消关注失败'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
