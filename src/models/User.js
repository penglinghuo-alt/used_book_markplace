/**
 * 用户数据模型
 * 负责处理与用户相关的数据库操作
 * 
 * 功能说明：
 * - 用户注册和登录验证
 * - 用户信息查询和更新
 * - 用户密码加密和验证
 */

const bcrypt = require('bcryptjs');  // 密码哈希库
const db = require('../config/database');
const logger = require('../config/logger');

/**
 * 用户模型类
 * 封装所有用户相关的数据库操作
 */
class User {
    /**
     * 创建新用户
     * @param {Object} userData - 用户数据
     * @param {string} userData.username - 用户名
     * @param {string} userData.password - 原始密码
     * @param {string} [userData.bio] - 个性签名
     * @param {string} [userData.wechat_id] - 微信联系方式
     * @param {string} [userData.phone] - 手机号
     * @returns {Promise<Object>} 创建的用户对象（不含密码）
     */
    static async create({ username, password, bio = '', wechat_id = null, phone = null }) {
        try {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            
            const sql = `
                INSERT INTO users (username, password_hash, bio, wechat_id, phone)
                VALUES (?, ?, ?, ?, ?)
            `;
            const userId = await db.insert(sql, [username, passwordHash, bio, wechat_id, phone]);
            
            logger.info(`新用户创建成功: ${username}`, { userId });
            
            return {
                id: userId,
                username,
                bio,
                wechat_id: wechat_id,
                phone: phone,
                created_at: new Date()
            };
        } catch (error) {
            // 处理用户名重复错误
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('用户名已存在');
            }
            logger.error('创建用户失败', { error: error.message, username });
            throw error;
        }
    }

    /**
     * 根据用户名查找用户
     * @param {string} username - 用户名
     * @returns {Promise<Object|null>} 用户对象或null
     */
    static async findByUsername(username) {
        try {
            const sql = 'SELECT * FROM users WHERE username = ?';
            const users = await db.query(sql, [username]);
            return users.length > 0 ? users[0] : null;
        } catch (error) {
            logger.error('查找用户失败', { error: error.message, username });
            throw error;
        }
    }

    /**
     * 根据用户ID查找用户
     * @param {number} id - 用户ID
     * @returns {Promise<Object|null>} 用户对象或null
     */
    static async findById(id) {
        try {
            const sql = 'SELECT id, username, bio, wechat_id, phone, avatar_url, created_at FROM users WHERE id = ?';
            const users = await db.query(sql, [id]);
            return users.length > 0 ? users[0] : null;
        } catch (error) {
            logger.error('查找用户失败', { error: error.message, userId: id });
            throw error;
        }
    }

    /**
     * 验证用户密码
     * @param {string} password - 原始密码
     * @param {string} hash - 数据库中存储的密码哈希
     * @returns {Promise<boolean>} 密码是否匹配
     */
    static async verifyPassword(password, hash) {
        try {
            // 使用 bcrypt 比较密码
            return await bcrypt.compare(password, hash);
        } catch (error) {
            logger.error('密码验证失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 更新用户信息
     * @param {number} id - 用户ID
     * @param {Object} updates - 要更新的字段
     * @returns {Promise<boolean>} 更新是否成功
     */
    static async update(id, { username, bio, wechat_id, avatar_url }) {
        try {
            const fields = [];
            const values = [];
            
            if (username !== undefined) {
                const existing = await this.findByUsername(username);
                if (existing && existing.id !== id) {
                    throw new Error('用户名已被使用');
                }
                fields.push('username = ?');
                values.push(username);
            }
            if (bio !== undefined) {
                fields.push('bio = ?');
                values.push(bio);
            }
            if (wechat_id !== undefined) {
                fields.push('wechat_id = ?');
                values.push(wechat_id);
            }
            if (avatar_url !== undefined) {
                fields.push('avatar_url = ?');
                values.push(avatar_url);
            }
            
            if (fields.length === 0) {
                return false;
            }
            
            values.push(id);
            const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            
            const affectedRows = await db.execute(sql, values);
            
            if (affectedRows > 0) {
                logger.info(`用户信息更新成功`, { userId: id });
            }
            
            return affectedRows > 0;
        } catch (error) {
            if (error.message === '用户名已被使用') {
                throw error;
            }
            logger.error('更新用户信息失败', { error: error.message, userId: id });
            throw error;
        }
    }

    /**
     * 更新用户密码
     * @param {number} id - 用户ID
     * @param {string} newPassword - 新密码
     * @returns {Promise<boolean>} 更新是否成功
     */
    static async updatePassword(id, newPassword) {
        try {
            // 生成新的密码哈希
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);
            
            const sql = 'UPDATE users SET password_hash = ? WHERE id = ?';
            const affectedRows = await db.execute(sql, [passwordHash, id]);
            
            if (affectedRows > 0) {
                logger.info(`用户密码更新成功`, { userId: id });
            }
            
            return affectedRows > 0;
        } catch (error) {
            logger.error('更新用户密码失败', { error: error.message, userId: id });
            throw error;
        }
    }

    /**
     * 获取所有用户列表（分页）
     * @param {number} page - 页码
     * @param {number} limit - 每页数量
     * @returns {Promise<Object>} 用户列表和分页信息
     */
    static async findAll(page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            
            // 获取用户列表
            const sql = `
                SELECT id, username, bio, wechat_id, created_at 
                FROM users 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            `;
            const users = await db.query(sql, [limit.toString(), offset.toString()]);
            
            // 获取总数
            const countSql = 'SELECT COUNT(*) as total FROM users';
            const countResult = await db.query(countSql);
            const total = countResult[0].total;
            
            return {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('获取用户列表失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 获取用户列表（用于选择买家，排除当前用户）
     * @param {number} excludeUserId - 排除的用户ID
     * @returns {Promise<Array>} 用户列表
     */
    static async getUsersForSelection(excludeUserId) {
        try {
            const sql = `
                SELECT id, username, wechat_id 
                FROM users 
                WHERE id != ?
                ORDER BY username ASC
            `;
            const users = await db.query(sql, [excludeUserId]);
            return users;
        } catch (error) {
            logger.error('获取用户列表失败', { error: error.message });
            throw error;
        }
    }

    static async findByPhone(phone) {
        try {
            const sql = `
                SELECT id, username, phone, bio, wechat_id, avatar_url, created_at 
                FROM users 
                WHERE phone = ?
            `;
            const users = await db.query(sql, [phone]);
            return users.length > 0 ? users[0] : null;
        } catch (error) {
            logger.error('通过手机号查找用户失败', { error: error.message, phone });
            throw error;
        }
    }

    static async updatePhone(id, phone) {
        try {
            const sql = 'UPDATE users SET phone = ? WHERE id = ?';
            const affectedRows = await db.execute(sql, [phone, id]);
            return affectedRows > 0;
        } catch (error) {
            logger.error('更新手机号失败', { error: error.message, userId: id });
            throw error;
        }
    }

    static async delete(id) {
        try {
            const sql = 'DELETE FROM users WHERE id = ?';
            const affectedRows = await db.execute(sql, [id]);
            return affectedRows > 0;
        } catch (error) {
            logger.error('删除用户失败', { error: error.message, userId: id });
            throw error;
        }
    }
}

module.exports = User;
