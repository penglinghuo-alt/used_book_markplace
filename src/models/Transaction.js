/**
 * 交易记录数据模型
 * 负责处理与交易相关的数据库操作
 * 
 * 功能说明：
 * - 当卖家确认"已售出给某人"时创建交易记录
 * - 交易记录查询和统计
 * - 关联书籍状态同步更新
 */

const db = require('../config/database');
const logger = require('../config/logger');

/**
 * 交易模型类
 * 封装所有交易相关的数据库操作
 */
class Transaction {
    /**
     * 创建交易记录
     * 当卖家确认书籍已售出时调用
     * 
     * @param {Object} transactionData - 交易数据
     * @param {number} transactionData.book_id - 书籍ID
     * @param {number} transactionData.buyer_id - 买家ID
     * @param {number} transactionData.seller_id - 卖家ID
     * @returns {Promise<Object>} 创建的交易记录
     */
    static async create({ book_id, buyer_id, seller_id }) {
        const connection = await db.pool.getConnection();
        
        try {
            // 开启事务确保数据一致性
            await connection.beginTransaction();
            
            // 1. 检查书籍是否存在且状态为挂售中
            const [book] = await connection.execute(
                'SELECT * FROM books WHERE id = ? FOR UPDATE',
                [book_id]
            );
            
            if (book.length === 0) {
                throw new Error('书籍不存在');
            }
            
            if (book[0].status === 'sold') {
                throw new Error('该书籍已经售出');
            }
            
            if (book[0].seller_id !== seller_id) {
                throw new Error('只有卖家才能确认交易');
            }
            
            if (book[0].seller_id === buyer_id) {
                throw new Error('卖家不能购买自己的书籍');
            }
            
            // 2. 验证买家是否存在
            const [buyer] = await connection.execute(
                'SELECT id FROM users WHERE id = ?',
                [buyer_id]
            );
            
            if (buyer.length === 0) {
                throw new Error('买家不存在');
            }
            
            // 3. 更新书籍状态为已售出
            await connection.execute(
                'UPDATE books SET status = ? WHERE id = ?',
                ['sold', book_id]
            );
            
            // 4. 创建交易记录
            const [result] = await connection.execute(
                'INSERT INTO transactions (book_id, buyer_id, seller_id) VALUES (?, ?, ?)',
                [book_id, buyer_id, seller_id]
            );
            
            // 提交事务
            await connection.commit();
            
            logger.info(`交易记录创建成功`, { 
                transactionId: result.insertId, 
                book_id, 
                buyer_id, 
                seller_id 
            });
            
            return {
                id: result.insertId,
                book_id,
                buyer_id,
                seller_id,
                completed_at: new Date()
            };
        } catch (error) {
            // 回滚事务
            await connection.rollback();
            logger.error('创建交易记录失败', { error: error.message, book_id, buyer_id });
            throw error;
        } finally {
            // 释放连接
            connection.release();
        }
    }

    /**
     * 根据ID查找交易记录
     * @param {number} id - 交易ID
     * @returns {Promise<Object|null>} 交易记录或null
     */
    static async findById(id) {
        try {
            const sql = `
                SELECT t.*, 
                       b.title as book_title,
                       b.price as book_price,
                       buyer.username as buyer_name,
                       seller.username as seller_name
                FROM transactions t
                JOIN books b ON t.book_id = b.id
                JOIN users buyer ON t.buyer_id = buyer.id
                JOIN users seller ON t.seller_id = seller.id
                WHERE t.id = ?
            `;
            const transactions = await db.query(sql, [id]);
            return transactions.length > 0 ? transactions[0] : null;
        } catch (error) {
            logger.error('查找交易记录失败', { error: error.message, transactionId: id });
            throw error;
        }
    }

    /**
     * 根据书籍ID查找交易记录
     * @param {number} bookId - 书籍ID
     * @returns {Promise<Object|null>} 交易记录或null
     */
    static async findByBookId(bookId) {
        try {
            const sql = `
                SELECT t.*, 
                       b.title as book_title,
                       buyer.username as buyer_name,
                       seller.username as seller_name
                FROM transactions t
                JOIN books b ON t.book_id = b.id
                JOIN users buyer ON t.buyer_id = buyer.id
                JOIN users seller ON t.seller_id = seller.id
                WHERE t.book_id = ?
            `;
            const transactions = await db.query(sql, [bookId]);
            return transactions.length > 0 ? transactions[0] : null;
        } catch (error) {
            logger.error('查找书籍交易记录失败', { error: error.message, bookId });
            throw error;
        }
    }

    /**
     * 获取用户的所有交易记录（作为买家或卖家）
     * @param {number} userId - 用户ID
     * @param {string} [role] - 角色筛选：'buyer' 或 'seller'，不填则返回所有
     * @param {Object} options - 分页选项
     * @returns {Promise<Object>} 交易列表和分页信息
     */
    static async findByUser(userId, role = null, { page = 1, limit = 10 } = {}) {
        try {
            const offset = (page - 1) * limit;
            let whereClause = '(t.buyer_id = ? OR t.seller_id = ?)';
            const params = [userId, userId];
            
            // 根据角色筛选
            if (role === 'buyer') {
                whereClause = 't.buyer_id = ?';
                params.splice(1, 1); // 移除 seller 条件
            } else if (role === 'seller') {
                whereClause = 't.seller_id = ?';
                params.splice(0, 1); // 移除 buyer 条件
            }
            
            // 查询交易列表
            const sql = `
                SELECT t.*, 
                       b.title as book_title,
                       b.price as book_price,
                       b.status as book_status,
                       buyer.username as buyer_name,
                       seller.username as seller_name
                FROM transactions t
                JOIN books b ON t.book_id = b.id
                JOIN users buyer ON t.buyer_id = buyer.id
                JOIN users seller ON t.seller_id = seller.id
                WHERE ${whereClause}
                ORDER BY t.completed_at DESC
                LIMIT ? OFFSET ?
            `;
            
            params.push(limit.toString(), offset.toString());
            const transactions = await db.query(sql, params);
            
            // 获取总数
            const countSql = `
                SELECT COUNT(*) as total 
                FROM transactions t
                WHERE ${whereClause}
            `;
            const countParams = role === 'buyer' || role === 'seller' 
                ? [userId] 
                : [userId, userId];
            const countResult = await db.query(countSql, countParams);
            const total = countResult[0].total;
            
            return {
                transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('查询用户交易记录失败', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * 获取所有交易记录（管理员用）
     * @param {Object} options - 查询选项
     * @returns {Promise<Object>} 交易列表和分页信息
     */
    static async findAll({ page = 1, limit = 10 } = {}) {
        try {
            const offset = (page - 1) * limit;
            
            const sql = `
                SELECT t.*, 
                       b.title as book_title,
                       b.price as book_price,
                       buyer.username as buyer_name,
                       seller.username as seller_name
                FROM transactions t
                JOIN books b ON t.book_id = b.id
                JOIN users buyer ON t.buyer_id = buyer.id
                JOIN users seller ON t.seller_id = seller.id
                ORDER BY t.completed_at DESC
                LIMIT ? OFFSET ?
            `;
            
            const transactions = await db.query(sql, [limit.toString(), offset.toString()]);
            
            const countSql = 'SELECT COUNT(*) as total FROM transactions';
            const countResult = await db.query(countSql);
            const total = countResult[0].total;
            
            return {
                transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('查询所有交易记录失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 获取销售统计
     * @param {number} [userId] - 用户ID（不传则获取全局统计）
     * @returns {Promise<Object>} 统计信息
     */
    static async getStatistics(userId = null) {
        try {
            let sql, params = [];
            
            if (userId) {
                // 指定用户的销售统计
                sql = `
                    SELECT 
                        COUNT(*) as total_transactions,
                        SUM(b.price) as total_revenue,
                        COUNT(DISTINCT seller_id) as sellers_count,
                        COUNT(DISTINCT buyer_id) as buyers_count
                    FROM transactions t
                    JOIN books b ON t.book_id = b.id
                    WHERE t.seller_id = ?
                `;
                params = [userId];
            } else {
                // 全局统计
                sql = `
                    SELECT 
                        COUNT(*) as total_transactions,
                        SUM(b.price) as total_revenue,
                        COUNT(DISTINCT seller_id) as sellers_count,
                        COUNT(DISTINCT buyer_id) as buyers_count
                    FROM transactions t
                    JOIN books b ON t.book_id = b.id
                `;
            }
            
            const result = await db.query(sql, params);
            return result[0];
        } catch (error) {
            logger.error('获取销售统计失败', { error: error.message });
            throw error;
        }
    }
}

module.exports = Transaction;
