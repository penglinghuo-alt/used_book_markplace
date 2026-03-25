/**
 * 好友关系数据模型
 * 负责处理与好友关系相关的数据库操作
 */

const db = require('../config/database');
const logger = require('../config/logger');

class Friendship {
    /**
     * 发送好友申请
     * @param {number} userId - 发送者ID
     * @param {number} friendId - 接收者ID
     * @param {string} message - 申请留言
     * @returns {Promise<Object>} 创建的好友申请
     */
    static async createRequest(userId, friendId, message = '') {
        if (userId === friendId) {
            throw new Error('不能添加自己为好友');
        }
        
        const existing = await this.findRelation(userId, friendId);
        if (existing) {
            if (existing.status === 'accepted') {
                throw new Error('你们已经是好友了');
            }
            if (existing.status === 'pending') {
                throw new Error('已发送过好友申请，请等待对方处理');
            }
        }
        
        try {
            const sql = `
                INSERT INTO friendships (user_id, friend_id, message, status)
                VALUES (?, ?, ?, 'pending')
            `;
            const id = await db.insert(sql, [userId, friendId, message]);
            
            logger.info(`好友申请已发送`, { from: userId, to: friendId });
            
            return {
                id,
                user_id: userId,
                friend_id: friendId,
                message,
                status: 'pending'
            };
        } catch (error) {
            logger.error('发送好友申请失败', { error: error.message, userId, friendId });
            throw error;
        }
    }

    /**
     * 查找两个用户之间的关系
     */
    static async findRelation(userId, friendId) {
        const sql = `
            SELECT * FROM friendships 
            WHERE (user_id = ? AND friend_id = ?) 
               OR (user_id = ? AND friend_id = ?)
        `;
        const results = await db.query(sql, [userId, friendId, friendId, userId]);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * 获取用户的好友列表（双向查询）
     */
    static async getFriends(userId) {
        const sql = `
            SELECT 
                CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END as friend_id,
                u.username as friend_name,
                u.avatar_url as friend_avatar,
                u.bio as friend_bio,
                CASE WHEN f.user_id = ? THEN 'sent' ELSE 'received' END as relation_type
            FROM friendships f
            JOIN users u ON u.id = CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END
            WHERE ((f.user_id = ? AND f.status = 'accepted') 
               OR (f.friend_id = ? AND f.status = 'accepted'))
            ORDER BY f.updated_at DESC
        `;
        return await db.query(sql, [userId, userId, userId, userId, userId]);
    }

    /**
     * 获取用户收到的所有好友申请（待处理）
     */
    static async getPendingRequests(userId) {
        const sql = `
            SELECT f.*, 
                   u.username as from_username,
                   u.avatar_url as from_avatar,
                   u.bio as from_bio
            FROM friendships f
            JOIN users u ON f.user_id = u.id
            WHERE f.friend_id = ? AND f.status = 'pending'
            ORDER BY f.created_at DESC
        `;
        return await db.query(sql, [userId]);
    }

    /**
     * 获取用户发出的所有好友申请
     */
    static async getSentRequests(userId) {
        const sql = `
            SELECT f.*, 
                   u.username as to_username,
                   u.avatar_url as to_avatar
            FROM friendships f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = ? AND f.status = 'pending'
            ORDER BY f.created_at DESC
        `;
        return await db.query(sql, [userId]);
    }

    /**
     * 同意好友申请
     */
    static async acceptRequest(userId, friendId) {
        const relation = await this.findRelation(userId, friendId);
        if (!relation) {
            throw new Error('好友申请不存在');
        }
        if (relation.friend_id !== userId) {
            throw new Error('只能处理发给自己的申请');
        }
        if (relation.status !== 'pending') {
            throw new Error('该申请已被处理');
        }
        
        const sql = `UPDATE friendships SET status = 'accepted' WHERE id = ?`;
        await db.execute(sql, [relation.id]);
        
        logger.info(`好友申请已同意`, { userId, friendId });
        return true;
    }

    /**
     * 拒绝好友申请
     */
    static async rejectRequest(userId, friendId) {
        const relation = await this.findRelation(userId, friendId);
        if (!relation) {
            throw new Error('好友申请不存在');
        }
        if (relation.friend_id !== userId) {
            throw new Error('只能处理发给自己的申请');
        }
        if (relation.status !== 'pending') {
            throw new Error('该申请已被处理');
        }
        
        const sql = `UPDATE friendships SET status = 'rejected' WHERE id = ?`;
        await db.execute(sql, [relation.id]);
        
        logger.info(`好友申请已拒绝`, { userId, friendId });
        return true;
    }

    /**
     * 获取用户的好友申请数量（待处理）
     */
    static async getPendingCount(userId) {
        const sql = `
            SELECT COUNT(*) as count 
            FROM friendships 
            WHERE friend_id = ? AND status = 'pending'
        `;
        const result = await db.query(sql, [userId]);
        return result[0].count;
    }

    /**
     * 检查两个用户是否为好友
     */
    static async areFriends(userId, friendId) {
        const relation = await this.findRelation(userId, friendId);
        return relation && relation.status === 'accepted';
    }

    /**
     * 删除好友
     */
    static async deleteFriend(userId, friendId) {
        const sql = `
            DELETE FROM friendships 
            WHERE (user_id = ? AND friend_id = ?) 
               OR (user_id = ? AND friend_id = ?)
        `;
        await db.execute(sql, [userId, friendId, friendId, userId]);
        logger.info(`好友已删除`, { userId, friendId });
        return true;
    }
}

module.exports = Friendship;
