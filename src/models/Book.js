/**
 * 书籍数据模型
 * 负责处理与书籍/挂售相关的数据库操作
 * 
 * 功能说明：
 * - 书籍的增删改查
 * - 书籍状态管理（挂售中/已售出）
 * - 书籍搜索和筛选
 */

const db = require('../config/database');
const logger = require('../config/logger');

/**
 * 书籍模型类
 * 封装所有书籍相关的数据库操作
 */
class Book {
    /**
     * 创建新书籍挂售
     * @param {Object} bookData - 书籍数据
     * @param {number} bookData.seller_id - 卖家ID
     * @param {string} bookData.title - 书名
     * @param {string} bookData.author - 作者
     * @param {number} bookData.price - 价格
     * @param {string} [bookData.description] - 描述/新旧程度
     * @param {string} [bookData.image_url] - 书籍图片URL
     * @param {string} [bookData.category] - 分类：teaching=教辅, textbook=课本, notebook=笔记本, other=其他
     * @returns {Promise<Object>} 创建的书籍对象
     */
    static async create({ seller_id, title, author, price, description = '', image_url = null, category = 'other' }) {
        try {
            const sql = `
                INSERT INTO books (seller_id, title, author, price, description, image_url, category, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
            `;
            const bookId = await db.insert(sql, [seller_id, title, author, price, description, image_url, category]);
            
            logger.info(`新书籍挂售成功`, { bookId, title, seller_id });
            
            return {
                id: bookId,
                seller_id,
                title,
                author,
                price,
                description,
                image_url,
                category,
                status: 'active',
                created_at: new Date()
            };
        } catch (error) {
            logger.error('创建书籍挂售失败', { error: error.message, seller_id });
            throw error;
        }
    }

    /**
     * 根据ID查找书籍
     * @param {number} id - 书籍ID
     * @returns {Promise<Object|null>} 书籍对象或null
     */
    static async findById(id) {
        try {
            // 联表查询获取卖家信息
            const sql = `
                SELECT b.*, u.username as seller_name
                FROM books b
                JOIN users u ON b.seller_id = u.id
                WHERE b.id = ?
            `;
            const books = await db.query(sql, [id]);
            return books.length > 0 ? books[0] : null;
        } catch (error) {
            logger.error('查找书籍失败', { error: error.message, bookId: id });
            throw error;
        }
    }

    /**
     * 获取所有挂售中的书籍（分页）
     * 支持按关键词搜索书名或作者
     * @param {Object} options - 查询选项
     * @param {number} options.page - 页码
     * @param {number} options.limit - 每页数量
     * @param {string} [options.search] - 搜索关键词
     * @param {string} [options.status] - 书籍状态
     * @returns {Promise<Object>} 书籍列表和分页信息
     */
    static async findAll({ page = 1, limit = 10, search = '', status = 'active' } = {}) {
        try {
            const offset = (page - 1) * limit;
            let sql, countSql, params = [], countParams = [];
            
            // 构建查询条件
            let whereClause = 'WHERE 1=1';
            
            if (status) {
                whereClause += ' AND b.status = ?';
                params.push(status);
                countParams.push(status);
            }
            
            if (search) {
                // 搜索书名或作者（使用 LIKE 模糊匹配）
                whereClause += ' AND (b.title LIKE ? OR b.author LIKE ?)';
                const searchPattern = `%${search}%`;
                params.push(searchPattern, searchPattern);
                countParams.push(searchPattern, searchPattern);
            }
            
            // 查询书籍列表
            sql = `
                SELECT b.*, u.username as seller_name
                FROM books b
                JOIN users u ON b.seller_id = u.id
                ${whereClause}
                ORDER BY b.created_at DESC
                LIMIT ? OFFSET ?
            `;
            params.push(limit.toString(), offset.toString());
            
            const books = await db.query(sql, params);
            
            // 查询总数
            countSql = `
                SELECT COUNT(*) as total 
                FROM books b
                ${whereClause}
            `;
            const countResult = await db.query(countSql, countParams);
            const total = countResult[0].total;
            
            logger.info(`查询书籍列表`, { page, limit, search, status, total });
            
            return {
                books,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('查询书籍列表失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 获取某个卖家发布的所有书籍
     * @param {number} sellerId - 卖家ID
     * @param {string} [status] - 书籍状态筛选
     * @returns {Promise<Array>} 书籍列表
     */
    static async findBySeller(sellerId, status = null) {
        try {
            let sql = `
                SELECT b.*, 
                       u.username as seller_name,
                       t.buyer_id,
                       buyer.username as buyer_name,
                       buyer.wechat_id as buyer_wechat
                FROM books b
                JOIN users u ON b.seller_id = u.id
                LEFT JOIN transactions t ON b.id = t.book_id
                LEFT JOIN users buyer ON t.buyer_id = buyer.id
                WHERE b.seller_id = ?
            `;
            const params = [sellerId];
            
            if (status) {
                sql += ' AND b.status = ?';
                params.push(status);
            }
            
            sql += ' ORDER BY b.created_at DESC';
            
            const books = await db.query(sql, params);
            return books;
        } catch (error) {
            logger.error('查询卖家书籍失败', { error: error.message, sellerId });
            throw error;
        }
    }

    /**
     * 更新书籍信息
     * @param {number} id - 书籍ID
     * @param {Object} updates - 要更新的字段
     * @returns {Promise<boolean>} 更新是否成功
     */
    static async update(id, { title, author, price, description }) {
        try {
            const fields = [];
            const values = [];
            
            // 动态构建更新语句
            if (title !== undefined) {
                fields.push('title = ?');
                values.push(title);
            }
            if (author !== undefined) {
                fields.push('author = ?');
                values.push(author);
            }
            if (price !== undefined) {
                fields.push('price = ?');
                values.push(price);
            }
            if (description !== undefined) {
                fields.push('description = ?');
                values.push(description);
            }
            
            if (fields.length === 0) {
                return false;
            }
            
            values.push(id);
            const sql = `UPDATE books SET ${fields.join(', ')} WHERE id = ?`;
            
            const affectedRows = await db.execute(sql, values);
            
            if (affectedRows > 0) {
                logger.info(`书籍信息更新成功`, { bookId: id });
            }
            
            return affectedRows > 0;
        } catch (error) {
            logger.error('更新书籍信息失败', { error: error.message, bookId: id });
            throw error;
        }
    }

    /**
     * 更新书籍状态
     * @param {number} id - 书籍ID
     * @param {string} status - 新状态 ('active' 或 'sold')
     * @returns {Promise<boolean>} 更新是否成功
     */
    static async updateStatus(id, status, transactionData = null) {
        const connection = await db.pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const sql = 'UPDATE books SET status = ? WHERE id = ?';
            const [result] = await connection.execute(sql, [status, id]);
            
            if (result.affectedRows === 0) {
                await connection.rollback();
                return false;
            }
            
            if (status === 'sold' && transactionData) {
                const { buyer_id, seller_id } = transactionData;
                
                const [buyerCheck] = await connection.execute(
                    'SELECT id FROM users WHERE id = ?',
                    [buyer_id]
                );
                
                if (buyerCheck.length === 0) {
                    await connection.rollback();
                    throw new Error('买家不存在');
                }
                
                await connection.execute(
                    'INSERT INTO transactions (book_id, buyer_id, seller_id) VALUES (?, ?, ?)',
                    [id, buyer_id, seller_id]
                );
            }
            
            await connection.commit();
            
            if (result.affectedRows > 0) {
                logger.info(`书籍状态更新`, { bookId: id, status });
            }
            
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            logger.error('更新书籍状态失败', { error: error.message, bookId: id });
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 删除书籍
     * @param {number} id - 书籍ID
     * @returns {Promise<boolean>} 删除是否成功
     */
    static async delete(id) {
        try {
            const sql = 'DELETE FROM books WHERE id = ?';
            const affectedRows = await db.execute(sql, [id]);
            
            if (affectedRows > 0) {
                logger.info(`书籍删除成功`, { bookId: id });
            }
            
            return affectedRows > 0;
        } catch (error) {
            logger.error('删除书籍失败', { error: error.message, bookId: id });
            throw error;
        }
    }
}

module.exports = Book;
