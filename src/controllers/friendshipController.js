/**
 * 好友关系控制器
 */

const Friendship = require('../models/Friendship');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * 发送好友申请
 * POST /api/friendships
 */
const sendRequest = asyncHandler(async (req, res) => {
    const { friend_id, message } = req.body;
    
    if (!friend_id) {
        throw new AppError('请选择要添加的好友', 400);
    }
    
    const friendship = await Friendship.createRequest(req.user.id, friend_id, message || '');
    
    res.status(201).json({
        success: true,
        message: '好友申请已发送',
        data: { friendship }
    });
});

/**
 * 获取我的好友列表
 * GET /api/friendships
 */
const getFriends = asyncHandler(async (req, res) => {
    const friends = await Friendship.getFriends(req.user.id);
    
    res.json({
        success: true,
        data: { friends }
    });
});

/**
 * 获取待处理的好友申请
 * GET /api/friendships/requests
 */
const getPendingRequests = asyncHandler(async (req, res) => {
    const requests = await Friendship.getPendingRequests(req.user.id);
    
    res.json({
        success: true,
        data: { requests }
    });
});

/**
 * 获取待处理申请数量
 * GET /api/friendships/requests/count
 */
const getPendingCount = asyncHandler(async (req, res) => {
    const count = await Friendship.getPendingCount(req.user.id);
    
    res.json({
        success: true,
        data: { count }
    });
});

/**
 * 同意好友申请
 * POST /api/friendships/:friendId/accept
 */
const acceptRequest = asyncHandler(async (req, res) => {
    const friendId = parseInt(req.params.friendId);
    
    await Friendship.acceptRequest(req.user.id, friendId);
    
    res.json({
        success: true,
        message: '已同意好友申请'
    });
});

/**
 * 拒绝好友申请
 * POST /api/friendships/:friendId/reject
 */
const rejectRequest = asyncHandler(async (req, res) => {
    const friendId = parseInt(req.params.friendId);
    
    await Friendship.rejectRequest(req.user.id, friendId);
    
    res.json({
        success: true,
        message: '已拒绝好友申请'
    });
});

/**
 * 检查是否为好友
 * GET /api/friendships/:friendId/status
 */
const checkFriendship = asyncHandler(async (req, res) => {
    const friendId = parseInt(req.params.friendId);
    
    const relation = await Friendship.findRelation(req.user.id, friendId);
    
    let status = 'none';
    if (relation) {
        if (relation.status === 'accepted') {
            status = 'friends';
        } else if (relation.status === 'pending') {
            status = relation.user_id === req.user.id ? 'sent' : 'received';
        } else {
            status = 'rejected';
        }
    }
    
    res.json({
        success: true,
        data: { status }
    });
});

/**
 * 删除好友
 * DELETE /api/friendships/:friendId
 */
const deleteFriend = asyncHandler(async (req, res) => {
    const friendId = parseInt(req.params.friendId);
    
    await Friendship.deleteFriend(req.user.id, friendId);
    
    res.json({
        success: true,
        message: '已删除好友'
    });
});

module.exports = {
    sendRequest,
    getFriends,
    getPendingRequests,
    getPendingCount,
    acceptRequest,
    rejectRequest,
    checkFriendship,
    deleteFriend
};
