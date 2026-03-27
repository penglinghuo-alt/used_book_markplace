/**
 * 路由汇总
 * 汇总所有 API 路由
 */

const express = require('express');
const router = express.Router();

// 导入各模块路由
const userRoutes = require('./userRoutes');
const bookRoutes = require('./bookRoutes');
const messageRoutes = require('./messageRoutes');
const transactionRoutes = require('./transactionRoutes');
const friendshipRoutes = require('./friendshipRoutes');
const followRoutes = require('./followRoutes');
const browseHistoryRoutes = require('./browseHistoryRoutes');
const logRoutes = require('./logRoutes');
const adminRoutes = require('./adminRoutes');

// ==================== 路由挂载 ====================

/**
 * 用户相关路由
 * 前缀: /api/users
 * 
 * 接口列表:
 * - POST   /api/users/register    - 用户注册
 * - POST   /api/users/login      - 用户登录
 * - GET    /api/users/me         - 获取当前用户资料
 * - PUT    /api/users/me         - 更新当前用户资料
 * - PUT    /api/users/me/password - 更新当前用户密码
 * - GET    /api/users            - 获取所有用户列表
 * - GET    /api/users/:id        - 获取指定用户资料
 */
router.use('/users', userRoutes);

/**
 * 书籍相关路由
 * 前缀: /api/books
 * 
 * 接口列表:
 * - POST   /api/books              - 发布新书籍
 * - GET    /api/books              - 获取书籍列表
 * - GET    /api/books/my           - 获取当前用户发布的书籍
 * - GET    /api/books/seller/:id   - 获取指定卖家的书籍
 * - GET    /api/books/:id          - 获取书籍详情
 * - PUT    /api/books/:id          - 更新书籍信息
 * - PATCH  /api/books/:id/status   - 更新书籍状态
 * - DELETE /api/books/:id          - 删除书籍
 */
router.use('/books', bookRoutes);

/**
 * 消息相关路由
 * 前缀: /api/messages
 * 
 * 接口列表:
 * - POST   /api/messages                    - 发送私信
 * - GET    /api/messages/conversations     - 获取会话列表
 * - GET    /api/messages/conversation/:id  - 获取聊天记录
 * - GET    /api/messages/book/:id           - 获取书籍相关消息
 * - GET    /api/messages/:id                - 获取消息详情
 * - DELETE /api/messages/:id                - 删除消息
 */
router.use('/messages', messageRoutes);

/**
 * 交易相关路由
 * 前缀: /api/transactions
 * 
 * 接口列表:
 * - POST   /api/transactions              - 创建交易记录
 * - GET    /api/transactions              - 获取当前用户交易记录
 * - GET    /api/transactions/stats        - 获取当前用户销售统计
 * - GET    /api/transactions/all          - 获取所有交易记录
 * - GET    /api/transactions/all/stats    - 获取全局销售统计
 * - GET    /api/transactions/book/:id     - 获取书籍交易记录
 * - GET    /api/transactions/:id          - 获取交易详情
 */
router.use('/transactions', transactionRoutes);

/**
 * 好友相关路由
 * 前缀: /api/friendships
 * 
 * 接口列表:
 * - POST   /api/friendships                    - 发送好友申请
 * - GET    /api/friendships                    - 获取好友列表
 * - GET    /api/friendships/requests          - 获取待处理申请
 * - GET    /api/friendships/requests/count    - 获取申请数量
 * - POST   /api/friendships/:friendId/accept  - 同意申请
 * - POST   /api/friendships/:friendId/reject   - 拒绝申请
 * - GET    /api/friendships/:friendId/status  - 检查好友状态
 * - DELETE /api/friendships/:friendId         - 删除好友
 */
router.use('/friendships', friendshipRoutes);

/**
 * 关注相关路由
 * 前缀: /api/follow
 * 
 * 接口列表:
 * - POST   /api/follow/:userId              - 关注用户
 * - DELETE /api/follow/:userId              - 取消关注
 * - GET    /api/follow/following            - 获取关注列表
 * - GET    /api/follow/followers            - 获取粉丝列表
 * - GET    /api/follow/counts/:userId       - 获取关注/粉丝数量
 * - GET    /api/follow/status/:userId       - 检查是否关注
 */
router.use('/follow', followRoutes);

/**
 * 浏览历史相关路由
 * 前缀: /api/browse-history
 * 
 * 接口列表:
 * - POST   /api/browse-history/:bookId      - 添加浏览记录
 * - GET    /api/browse-history              - 获取浏览历史
 * - GET    /api/browse-history/count        - 获取浏览历史数量
 * - DELETE /api/browse-history              - 清空浏览历史
 * - DELETE /api/browse-history/:bookId      - 删除单条记录
 */
router.use('/browse-history', browseHistoryRoutes);

/**
 * 日志相关路由
 * 前缀: /api/logs
 * 
 * 接口列表:
 * - POST   /api/logs/upload      - 上传用户日志
 * - GET    /api/logs/types      - 获取支持的日志类型
 */
router.use('/logs', logRoutes);

/**
 * 管理员相关路由
 * 前缀: /api/admin
 * 
 * 接口列表:
 * - POST   /api/admin/login            - 管理员登录（卡密）
 * - GET    /api/admin/stats            - 获取统计数据
 * - GET    /api/admin/books           - 获取所有书籍
 * - POST   /api/admin/books           - 创建书籍
 * - PUT    /api/admin/books/reorder   - 批量更新排序
 * - PUT    /api/admin/books/:id       - 更新书籍
 * - DELETE /api/admin/books/:id       - 删除书籍
 * - GET    /api/admin/users           - 获取所有用户
 * - POST   /api/admin/users           - 创建用户
 * - PUT    /api/admin/users/:id       - 更新用户
 * - DELETE /api/admin/users/:id       - 删除用户
 * - GET    /api/admin/feedbacks       - 获取所有反馈
 * - POST   /api/admin/feedbacks/:id/reply - 回复反馈
 */
router.use('/admin', adminRoutes);

// ==================== 健康检查 ====================

/**
 * @route   GET /api/health
 * @desc    API 健康检查
 * @access  公开
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API 服务运行正常',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
