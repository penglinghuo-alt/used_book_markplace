/**
 * 浏览历史数据模型
 * 负责处理用户浏览书籍历史的数据库操作
 */

const db = require('../config/database');
const logger = require('../config/logger');

class BrowseHistory {
    /**
     * 添加浏览记录
     * @param {number} userId - 用户ID
     * @param {number} bookId - 书籍ID
     * @returns {Promise<Object>} 浏览记录
     */
    static async addRecord(userId, bookId) {
        const existing = await this.findRecord(userId, bookId);
        
        if (existing) {
            const sql = `
                UPDATE browse_history 
                SET viewed_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;
            await db.execute(sql, [existing.id]);
            
            logger.info(`更新浏览记录`, { userId, bookId });
            
            return {
                ...existing,
                viewed_at: new Date()
            };
        }

        try {
            const sql = `
                INSERT INTO browse_history (user_id, book_id)
                VALUES (?, ?)
            `;
            const id = await db.insert(sql, [userId, bookId]);

            logger.info(`添加浏览记录`, { userId, bookId });

            return {
                id,
                user_id: userId,
                book_id: bookId
            };
        } catch (error) {
            logger.error('添加浏览记录失败', { error: error.message, userId, bookId });
            throw error;
        }
    }

    /**
     * 查找浏览记录
     * @param {number} userId - 用户ID
     * @param {number} bookId - 书籍ID
     * @returns {Promise<Object|null>}
     */
    static async findRecord(userId, bookId) {
        const sql = `
            SELECT * FROM browse_history 
            WHERE user_id = ? AND book_id = ?
        `;
        const results = await db.query(sql, [userId, bookId]);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * 获取用户的浏览历史
     * @param {number} userId - 用户ID
     * @param {number} limit - 限制数量，默认50
     * @returns {Promise<Array>}
     */
    static async getHistory(userId, limit = 50) {
        const sql = `
            SELECT bh.*, 
                   b.title as book_title,
                   b.author as book_author,
                   b.price as book_price,
                   b.image_url as book_image,
                   b.status as book_status,
                   b.category as book_category,
                   u.username as seller_name
            FROM browse_history bh
            JOIN books b ON bh.book_id = b.id
            JOIN users u ON b.seller_id = u.id
            WHERE bh.user_id = ?
            ORDER BY bh.viewed_at DESC
            LIMIT ?
        `;
        return await db.query(sql, [userId, limit]);
    }

    /**
     * 获取浏览历史数量
     * @param {number} userId - 用户ID
     * @returns {Promise<number>}
     */
    static async getHistoryCount(userId) {
        const sql = `
            SELECT COUNT(*) as count 
            FROM browse_history 
            WHERE user_id = ?
        `;
        const result = await db.query(sql, [userId]);
        return result[0].count;
    }

    /**
     * 清空用户的浏览历史
     * @param {number} userId - 用户ID
     * @returns {Promise<boolean>}
     */
    static async clearHistory(userId) {
        const sql = `
            DELETE FROM browse_history 
            WHERE user_id = ?
        `;
        await db.execute(sql, [userId]);
        logger.info(`清空浏览历史`, { userId });
        return true;
    }

    /**
     * 删除单条浏览记录
     * @param {number} userId - 用户ID
     * @param {number} bookId - 书籍ID
     * @returns {Promise<boolean>}
     */
    static async deleteRecord(userId, bookId) {
        const sql = `
            DELETE FROM browse_history 
            WHERE user_id = ? AND book_id = ?
        `;
        const affectedRows = await db.execute(sql, [userId, bookId]);
        return affectedRows > 0;
    }
}

module.exports = BrowseHistory;
