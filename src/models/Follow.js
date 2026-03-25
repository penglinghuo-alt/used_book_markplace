/**
 * 关注关系数据模型
 * 负责处理用户关注相关的数据库操作
 */

const db = require('../config/database');
const logger = require('../config/logger');

class Follow {
    /**
     * 关注用户
     * @param {number} followerId - 关注者ID
     * @param {number} followingId - 被关注者ID
     * @returns {Promise<Object>} 关注结果
     */
    static async follow(followerId, followingId) {
        if (followerId === followingId) {
            throw new Error('不能关注自己');
        }

        const existing = await this.findRelation(followerId, followingId);
        if (existing) {
            throw new Error('你已经关注过该用户');
        }

        try {
            const sql = `
                INSERT INTO follows (follower_id, following_id)
                VALUES (?, ?)
            `;
            const id = await db.insert(sql, [followerId, followingId]);

            logger.info(`用户 ${followerId} 关注了用户 ${followingId}`);

            return {
                id,
                follower_id: followerId,
                following_id: followingId
            };
        } catch (error) {
            logger.error('关注失败', { error: error.message, followerId, followingId });
            throw error;
        }
    }

    /**
     * 取消关注
     * @param {number} followerId - 关注者ID
     * @param {number} followingId - 被关注者ID
     * @returns {Promise<boolean>}
     */
    static async unfollow(followerId, followingId) {
        const sql = `
            DELETE FROM follows 
            WHERE follower_id = ? AND following_id = ?
        `;
        const affectedRows = await db.execute(sql, [followerId, followingId]);
        
        if (affectedRows > 0) {
            logger.info(`用户 ${followerId} 取消关注了用户 ${followingId}`);
            return true;
        }
        return false;
    }

    /**
     * 查找关注关系
     * @param {number} followerId - 关注者ID
     * @param {number} followingId - 被关注者ID
     * @returns {Promise<Object|null>}
     */
    static async findRelation(followerId, followingId) {
        const sql = `
            SELECT * FROM follows 
            WHERE follower_id = ? AND following_id = ?
        `;
        const results = await db.query(sql, [followerId, followingId]);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * 获取用户的关注列表
     * @param {number} userId - 用户ID
     * @returns {Promise<Array>}
     */
    static async getFollowing(userId) {
        const sql = `
            SELECT f.*, 
                   u.username as following_username,
                   u.avatar_url as following_avatar,
                   u.bio as following_bio,
                   u.created_at as following_created_at
            FROM follows f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
        `;
        return await db.query(sql, [userId]);
    }

    /**
     * 获取用户的粉丝列表
     * @param {number} userId - 用户ID
     * @returns {Promise<Array>}
     */
    static async getFollowers(userId) {
        const sql = `
            SELECT f.*, 
                   u.username as follower_username,
                   u.avatar_url as follower_avatar,
                   u.bio as follower_bio,
                   u.created_at as follower_created_at
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC
        `;
        return await db.query(sql, [userId]);
    }

    /**
     * 获取用户的关注数量
     * @param {number} userId - 用户ID
     * @returns {Promise<number>}
     */
    static async getFollowingCount(userId) {
        const sql = `
            SELECT COUNT(*) as count 
            FROM follows 
            WHERE follower_id = ?
        `;
        const result = await db.query(sql, [userId]);
        return result[0].count;
    }

    /**
     * 获取用户的粉丝数量
     * @param {number} userId - 用户ID
     * @returns {Promise<number>}
     */
    static async getFollowersCount(userId) {
        const sql = `
            SELECT COUNT(*) as count 
            FROM follows 
            WHERE following_id = ?
        `;
        const result = await db.query(sql, [userId]);
        return result[0].count;
    }

    /**
     * 检查是否关注了某用户
     * @param {number} followerId - 关注者ID
     * @param {number} followingId - 被关注者ID
     * @returns {Promise<boolean>}
     */
    static async isFollowing(followerId, followingId) {
        const relation = await this.findRelation(followerId, followingId);
        return !!relation;
    }

    /**
     * 获取用户的关注和粉丝数量（合并）
     * @param {number} userId - 用户ID
     * @returns {Promise<Object>}
     */
    static async getCounts(userId) {
        const [followingCount, followersCount] = await Promise.all([
            this.getFollowingCount(userId),
            this.getFollowersCount(userId)
        ]);
        return {
            following: followingCount,
            followers: followersCount
        };
    }
}

module.exports = Follow;
