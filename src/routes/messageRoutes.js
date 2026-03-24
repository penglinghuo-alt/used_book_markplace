/**
 * 消息路由
 * 定义与私信相关的 API 路由
 * 
 * 路由前缀: /api/messages
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { auth } = require('../middleware/auth');
const { strictRateLimiter } = require('../middleware/rateLimiter');
const {
    validate,
    sendMessageValidation,
    idParamValidation,
    paginationValidation
} = require('../middleware/validation');

/**
 * @route   POST /api/messages
 * @desc    发送私信
 * @access  需要认证
 */
router.post(
    '/',
    auth,
    strictRateLimiter({
        windowMs: 60 * 1000,
        maxRequests: 20
    }),
    validate(sendMessageValidation),
    messageController.sendMessage
);

/**
 * @route   GET /api/messages/conversations
 * @desc    获取当前用户的所有会话列表
 * @access  需要认证
 */
router.get(
    '/conversations',
    auth,
    messageController.getConversationsList
);

/**
 * @route   GET /api/messages/conversation/:partnerId
 * @desc    获取与某个用户的聊天记录
 * @access  需要认证
 * 
 * 查询参数：
 * - page: 页码
 * - limit: 每页数量
 */
router.get(
    '/conversation/:partnerId',
    auth,
    validate(paginationValidation),
    messageController.getConversation
);

/**
 * @route   GET /api/messages/unread-count
 * @desc    获取当前用户未读消息总数
 * @access  需要认证
 */
router.get(
    '/unread-count',
    auth,
    messageController.getUnreadCount
);

/**
 * @route   GET /api/messages/book/:bookId
 * @desc    获取与某本书相关的所有聊天记录
 * @access  需要认证
 */
router.get(
    '/book/:bookId',
    auth,
    messageController.getMessagesByBook
);

/**
 * @route   GET /api/messages/:id
 * @desc    获取单条消息详情
 * @access  需要认证（发送者或接收者）
 */
router.get(
    '/:id',
    auth,
    validate(idParamValidation),
    messageController.getMessageById
);

/**
 * @route   POST /api/messages/conversation/:partnerId/read
 * @desc    标记与某用户的聊天消息为已读
 * @access  需要认证
 */
router.post(
    '/conversation/:partnerId/read',
    auth,
    messageController.markConversationAsRead
);

/**
 * @route   DELETE /api/messages/:id
 * @desc    删除消息
 * @access  需要认证（仅发送者）
 */
router.delete(
    '/:id',
    auth,
    validate(idParamValidation),
    messageController.deleteMessage
);

module.exports = router;
