/**
 * 好友路由
 * 定义与好友关系相关的 API 路由
 * 
 * 路由前缀: /api/friendships
 */

const express = require('express');
const router = express.Router();
const friendshipController = require('../controllers/friendshipController');
const { auth } = require('../middleware/auth');

/**
 * @route   POST /api/friendships
 * @desc    发送好友申请
 * @access  需要认证
 */
router.post('/', auth, friendshipController.sendRequest);

/**
 * @route   GET /api/friendships
 * @desc    获取我的好友列表
 * @access  需要认证
 */
router.get('/', auth, friendshipController.getFriends);

/**
 * @route   GET /api/friendships/requests
 * @desc    获取待处理的好友申请
 * @access  需要认证
 */
router.get('/requests', auth, friendshipController.getPendingRequests);

/**
 * @route   GET /api/friendships/requests/count
 * @desc    获取待处理申请数量
 * @access  需要认证
 */
router.get('/requests/count', auth, friendshipController.getPendingCount);

/**
 * @route   POST /api/friendships/:friendId/accept
 * @desc    同意好友申请
 * @access  需要认证
 */
router.post('/:friendId/accept', auth, friendshipController.acceptRequest);

/**
 * @route   POST /api/friendships/:friendId/reject
 * @desc    拒绝好友申请
 * @access  需要认证
 */
router.post('/:friendId/reject', auth, friendshipController.rejectRequest);

/**
 * @route   GET /api/friendships/:friendId/status
 * @desc    检查好友关系状态
 * @access  需要认证
 */
router.get('/:friendId/status', auth, friendshipController.checkFriendship);

/**
 * @route   DELETE /api/friendships/:friendId
 * @desc    删除好友
 * @access  需要认证
 */
router.delete('/:friendId', auth, friendshipController.deleteFriend);

module.exports = router;
