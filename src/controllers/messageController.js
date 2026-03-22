/**
 * 消息控制器
 * 处理与私信相关的 HTTP 请求
 * 
 * 功能说明：
 * - 发送私信
 * - 获取聊天记录
 * - 获取会话列表
 * - 删除消息
 */

const Message = require('../models/Message');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

/**
 * 发送私信
 * POST /api/messages
 * 需要认证
 * 
 * 请求体：
 * {
 *   "receiver_id": 123,        // 接收者用户ID
 *   "book_id": 456,            // 关联的书籍ID（可选）
 *   "content": "您好，我想购买这本书"  // 消息内容
 * }
 */
const sendMessage = asyncHandler(async (req, res) => {
    const { receiver_id, book_id, content } = req.body;
    
    // 创建消息
    const message = await Message.create({
        sender_id: req.user.id,     // 从认证中间件获取发送者ID
        receiver_id,
        book_id: book_id || null,
        content
    });
    
    logger.info(`消息发送成功`, { 
        messageId: message.id, 
        senderId: req.user.id, 
        receiverId: receiver_id 
    });
    
    res.status(201).json({
        success: true,
        message: '消息发送成功',
        data: {
            message
        }
    });
});

/**
 * 获取与某个用户的聊天记录
 * GET /api/messages/conversation/:partnerId
 * 需要认证
 * 
 * 查询参数：
 * - page: 页码（默认1）
 * - limit: 每页数量（默认20）
 */
const getConversation = asyncHandler(async (req, res) => {
    const partnerId = parseInt(req.params.partnerId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await Message.getConversation(req.user.id, partnerId, { page, limit });
    
    res.status(200).json({
        success: true,
        data: result
    });
});

/**
 * 获取与某本书相关的所有聊天记录
 * GET /api/messages/book/:bookId
 * 需要认证
 * 
 * 返回与该书相关的所有私信记录
 */
const getMessagesByBook = asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.bookId);
    
    const messages = await Message.getByBook(bookId, req.user.id);
    
    res.status(200).json({
        success: true,
        data: {
            messages
        }
    });
});

/**
 * 获取当前用户的所有会话列表
 * GET /api/messages/conversations
 * 需要认证
 * 
 * 返回用户所有聊天会话，每个会话显示最新一条消息
 */
const getConversationsList = asyncHandler(async (req, res) => {
    const conversations = await Message.getConversationsList(req.user.id);
    
    res.status(200).json({
        success: true,
        data: {
            conversations
        }
    });
});

/**
 * 获取单条消息详情
 * GET /api/messages/:id
 * 需要认证
 * 
 * 只有消息的发送者或接收者可以查看
 */
const getMessageById = asyncHandler(async (req, res) => {
    const messageId = parseInt(req.params.id);
    
    const message = await Message.findById(messageId);
    
    if (!message) {
        throw new AppError('消息不存在', 404);
    }
    
    // 检查权限（只有发送者或接收者可以查看）
    if (message.sender_id !== req.user.id && message.receiver_id !== req.user.id) {
        throw new AppError('您没有权限查看此消息', 403);
    }
    
    res.status(200).json({
        success: true,
        data: {
            message
        }
    });
});

/**
 * 删除消息
 * DELETE /api/messages/:id
 * 需要认证
 * 
 * 只有消息发送者可以删除
 */
const deleteMessage = asyncHandler(async (req, res) => {
    const messageId = parseInt(req.params.id);
    
    // 获取消息信息
    const message = await Message.findById(messageId);
    
    if (!message) {
        throw new AppError('消息不存在', 404);
    }
    
    // 检查是否是发送者
    if (message.sender_id !== req.user.id) {
        throw new AppError('只有发送者可以删除消息', 403);
    }
    
    // 删除消息
    const success = await Message.delete(messageId, req.user.id);
    
    if (!success) {
        throw new AppError('删除失败', 500);
    }
    
    logger.info(`消息删除成功`, { messageId, userId: req.user.id });
    
    res.status(200).json({
        success: true,
        message: '消息删除成功'
    });
});

module.exports = {
    sendMessage,
    getConversation,
    getMessagesByBook,
    getConversationsList,
    getMessageById,
    deleteMessage
};
