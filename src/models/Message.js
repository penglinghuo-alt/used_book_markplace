/**
 * 消息数据模型
 * 负责处理与私信相关的数据库操作
 * 
 * 功能说明：
 * - 用户之间的私信发送和接收
 * - 按书籍关联的聊天记录查询
 * - 消息已读未读状态（可扩展）
 */

const db = require('../config/database');
const logger = require('../config/logger');

/**
 * 消息模型类
 * 封装所有消息相关的数据库操作
 */
class Message {
    /**
     * 发送消息
     * @param {Object} messageData - 消息数据
     * @param {number} messageData.sender_id - 发送者ID
     * @param {number} messageData.receiver_id - 接收者ID
     * @param {number|null} messageData.book_id - 关联的书籍ID（可选）
     * @param {string} messageData.content - 消息内容
     * @returns {Promise<Object>} 创建的消息对象
     */
    static async create({ sender_id, receiver_id, book_id = null, content }) {
        try {
            // 不能给自己发消息
            if (sender_id === receiver_id) {
                throw new Error('不能给自己发送消息');
            }
            
            const sql = `
                INSERT INTO messages (sender_id, receiver_id, book_id, content)
                VALUES (?, ?, ?, ?)
            `;
            const messageId = await db.insert(sql, [sender_id, receiver_id, book_id, content]);
            
            logger.info(`消息发送成功`, { messageId, sender_id, receiver_id });
            
            // 返回创建的消息
            return {
                id: messageId,
                sender_id,
                receiver_id,
                book_id,
                content,
                sent_at: new Date()
            };
        } catch (error) {
            logger.error('发送消息失败', { error: error.message, sender_id, receiver_id });
            throw error;
        }
    }

    /**
     * 根据ID查找消息
     * @param {number} id - 消息ID
     * @returns {Promise<Object|null>} 消息对象或null
     */
    static async findById(id) {
        try {
            const sql = `
                SELECT m.*, 
                       s.username as sender_name,
                       r.username as receiver_name,
                       b.title as book_title
                FROM messages m
                JOIN users s ON m.sender_id = s.id
                JOIN users r ON m.receiver_id = r.id
                LEFT JOIN books b ON m.book_id = b.id
                WHERE m.id = ?
            `;
            const messages = await db.query(sql, [id]);
            return messages.length > 0 ? messages[0] : null;
        } catch (error) {
            logger.error('查找消息失败', { error: error.message, messageId: id });
            throw error;
        }
    }

    /**
     * 获取与某个用户的聊天记录
     * @param {number} userId - 当前用户ID
     * @param {number} otherUserId - 对方用户ID
     * @param {Object} options - 分页选项
     * @returns {Promise<Object>} 消息列表和分页信息
     */
    static async getConversation(userId, otherUserId, { page = 1, limit = 20 } = {}) {
        try {
            const offset = (page - 1) * limit;
            
            // 查询与特定用户的聊天记录（双向）
            const sql = `
                SELECT m.*, 
                       s.username as sender_name,
                       r.username as receiver_name,
                       b.title as book_title
                FROM messages m
                JOIN users s ON m.sender_id = s.id
                JOIN users r ON m.receiver_id = r.id
                LEFT JOIN books b ON m.book_id = b.id
                WHERE (m.sender_id = ? AND m.receiver_id = ?)
                   OR (m.sender_id = ? AND m.receiver_id = ?)
                ORDER BY m.sent_at DESC
                LIMIT ? OFFSET ?
            `;
            
            const messages = await db.query(sql, [
                userId, otherUserId, 
                otherUserId, userId,
                limit.toString(), offset.toString()
            ]);
            
            // 获取消息总数
            const countSql = `
                SELECT COUNT(*) as total 
                FROM messages 
                WHERE (sender_id = ? AND receiver_id = ?)
                   OR (sender_id = ? AND receiver_id = ?)
            `;
            const countResult = await db.query(countSql, [
                userId, otherUserId, 
                otherUserId, userId
            ]);
            const total = countResult[0].total;
            
            return {
                messages: messages.reverse(),  // 按时间正序返回
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('获取聊天记录失败', { error: error.message, userId, otherUserId });
            throw error;
        }
    }

    /**
     * 获取与某本书相关的所有聊天记录
     * @param {number} bookId - 书籍ID
     * @param {number} userId - 当前用户ID（用于权限校验）
     * @returns {Promise<Array>} 消息列表
     */
    static async getByBook(bookId, userId) {
        try {
            // 查询与这本书相关的消息（只有参与聊天的用户才能查看）
            const sql = `
                SELECT m.*, 
                       s.username as sender_name,
                       r.username as receiver_name,
                       b.title as book_title
                FROM messages m
                JOIN users s ON m.sender_id = s.id
                JOIN users r ON m.receiver_id = r.id
                JOIN books b ON m.book_id = b.id
                WHERE m.book_id = ?
                  AND (m.sender_id = ? OR m.receiver_id = ?)
                ORDER BY m.sent_at ASC
            `;
            
            const messages = await db.query(sql, [bookId, userId, userId]);
            return messages;
        } catch (error) {
            logger.error('获取书籍相关消息失败', { error: error.message, bookId, userId });
            throw error;
        }
    }

    /**
     * 获取用户的所有聊天会话列表
     * 每个会话显示最新的一条消息
     * @param {number} userId - 用户ID
     * @returns {Promise<Array>} 会话列表
     */
    static async getConversationsList(userId) {
        try {
            // 使用子查询获取每个对话的最新消息
            const sql = `
                SELECT 
                    CASE 
                        WHEN m.sender_id = ? THEN m.receiver_id 
                        ELSE m.sender_id 
                    END as partner_id,
                    u.username as partner_name,
                    m.content as last_message,
                    m.sent_at as last_sent_at,
                    (SELECT COUNT(*) FROM messages 
                     WHERE sender_id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
                       AND receiver_id = ? AND sent_at > m.sent_at) as unread_count
                FROM messages m
                JOIN users u ON u.id = CASE 
                    WHEN m.sender_id = ? THEN m.receiver_id 
                    ELSE m.sender_id 
                END
                WHERE m.id IN (
                    SELECT MAX(id) FROM messages
                    WHERE sender_id = ? OR receiver_id = ?
                    GROUP BY CASE 
                        WHEN sender_id = ? THEN receiver_id 
                        ELSE sender_id 
                    END
                )
                ORDER BY m.sent_at DESC
            `;
            
            const conversations = await db.query(sql, [
                userId, userId, userId,
                userId,
                userId, userId,
                userId
            ]);
            
            return conversations;
        } catch (error) {
            logger.error('获取会话列表失败', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * 删除消息（仅发送者可删除）
     * @param {number} id - 消息ID
     * @param {number} userId - 用户ID（校验发送者身份）
     * @returns {Promise<boolean>} 删除是否成功
     */
    static async delete(id, userId) {
        try {
            // 确保只有发送者可以删除自己的消息
            const sql = 'DELETE FROM messages WHERE id = ? AND sender_id = ?';
            const affectedRows = await db.execute(sql, [id, userId]);
            
            if (affectedRows > 0) {
                logger.info(`消息删除成功`, { messageId: id, userId });
            }
            
            return affectedRows > 0;
        } catch (error) {
            logger.error('删除消息失败', { error: error.message, messageId: id });
            throw error;
        }
    }
}

module.exports = Message;
