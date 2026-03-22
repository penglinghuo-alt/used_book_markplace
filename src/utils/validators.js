/**
 * 工具函数
 * 包含项目中使用的通用辅助函数
 */

/**
 * 成功响应格式化
 * 统一 API 成功响应的格式
 * 
 * @param {Object} res - Express 响应对象
 * @param {Object} data - 返回的数据
 * @param {string} message - 成功消息
 * @param {number} statusCode - HTTP 状态码（默认 200）
 */
const successResponse = (res, data, message = '操作成功', statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

/**
 * 错误响应格式化
 * 统一 API 错误响应的格式
 * 
 * @param {Object} res - Express 响应对象
 * @param {string} message - 错误消息
 * @param {number} statusCode - HTTP 状态码（默认 500）
 */
const errorResponse = (res, message, statusCode = 500) => {
    res.status(statusCode).json({
        success: false,
        message
    });
};

/**
 * 分页响应格式化
 * 统一分页数据的响应格式
 * 
 * @param {Array} items - 数据列表
 * @param {Object} pagination - 分页信息
 * @param {number} pagination.page - 当前页码
 * @param {number} pagination.limit - 每页数量
 * @param {number} pagination.total - 总数量
 * @param {number} pagination.totalPages - 总页数
 */
const paginatedResponse = (items, pagination) => {
    return {
        items,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
            hasMore: pagination.page < pagination.totalPages
        }
    };
};

/**
 * 清理字符串
 * 去除首尾空格，处理 null 和 undefined
 * 
 * @param {string} str - 输入字符串
 * @returns {string|null} 清理后的字符串
 */
const sanitizeString = (str) => {
    if (str === null || str === undefined) {
        return null;
    }
    return String(str).trim();
};

/**
 * 验证是否为正整数
 * 
 * @param {any} value - 要检查的值
 * @returns {boolean} 是否为正整数
 */
const isPositiveInteger = (value) => {
    const num = parseInt(value, 10);
    return Number.isInteger(num) && num > 0;
};

/**
 * 格式化日期为 ISO 字符串
 * 
 * @param {Date|string} date - 日期
 * @returns {string} ISO 格式的日期字符串
 */
const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toISOString();
};

/**
 * 限制字符串长度
 * 如果字符串超过指定长度，截断并添加省略号
 * 
 * @param {string} str - 输入字符串
 * @param {number} maxLength - 最大长度
 * @returns {string} 处理后的字符串
 */
const truncateString = (str, maxLength = 100) => {
    if (!str || str.length <= maxLength) {
        return str;
    }
    return str.substring(0, maxLength - 3) + '...';
};

/**
 * 生成随机字符串
 * 
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
const generateRandomString = (length = 32) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

/**
 * 延迟执行
 * 用于测试或重试逻辑
 * 
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise} Promise 对象
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
    successResponse,
    errorResponse,
    paginatedResponse,
    sanitizeString,
    isPositiveInteger,
    formatDate,
    truncateString,
    generateRandomString,
    sleep
};
