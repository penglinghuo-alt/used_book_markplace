/**
 * 输入验证中间件
 * 使用 express-validator 对用户输入进行验证和清理
 * 
 * 功能说明：
 * - 注册和登录参数验证
 * - 书籍信息验证
 * - 消息内容验证
 * - 交易参数验证
 */

const { body, param, query, validationResult } = require('express-validator');
const logger = require('../config/logger');

/**
 * 处理验证结果的中间件
 * 如果验证失败，返回错误信息
 * 
 * 使用方式：
 * router.post('/register', validate(validateRules), controller);
 */
const validate = (validations) => {
    return async (req, res, next) => {
        // 执行所有验证规则
        await Promise.all(validations.map(validation => validation.run(req)));
        
        const errors = validationResult(req);
        
        if (errors.isEmpty()) {
            return next();
        }
        
        // 格式化错误信息
        const errorMessages = errors.array().map(err => ({
            field: err.path,
            message: err.msg
        }));
        
        logger.warn('输入验证失败', { errors: errorMessages, path: req.path });
        
        return res.status(400).json({
            success: false,
            message: '输入验证失败',
            errors: errorMessages
        });
    };
};

// ==================== 用户验证规则 ====================

/**
 * 用户名验证规则
 * - 用户名长度 2-30 个字符
 * - 可包含中文、字母、数字、下划线
 */
const usernameValidation = body('username')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('用户名长度必须为 2-30 个字符')
    .matches(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含中文、字母、数字和下划线');

/**
 * 密码验证规则
 * - 密码长度至少 8 个字符
 * - 必须包含大小写字母和数字
 */
const passwordValidation = body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('密码长度至少为 8 个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .withMessage('密码必须包含大小写字母和数字');

/**
 * 注册验证规则
 */
const registerValidation = [
    usernameValidation,
    passwordValidation,
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('个性签名最多 255 个字符'),
    body('wechat_id')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('微信ID最多 100 个字符')
];

/**
 * 登录验证规则
 */
const loginValidation = [
    usernameValidation,
    passwordValidation
];

/**
 * 更新用户信息验证规则
 */
const updateUserValidation = [
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('个性签名最多 255 个字符'),
    body('wechat_id')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('微信ID最多 100 个字符'),
    body('oldPassword')
        .optional()
        .isLength({ min: 6 })
        .withMessage('原密码长度至少为 6 个字符'),
    body('newPassword')
        .optional()
        .isLength({ min: 6 })
        .withMessage('新密码长度至少为 6 个字符')
];

// ==================== 书籍验证规则 ====================

/**
 * 创建书籍验证规则
 */
const createBookValidation = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('书名长度必须为 1-200 个字符'),
    body('author')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('作者长度必须为 1-100 个字符'),
    body('price')
        .isFloat({ min: 0.01, max: 999999.99 })
        .withMessage('价格必须为 0.01-999999.99 之间的数字'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('描述最多 2000 个字符')
];

/**
 * 更新书籍验证规则
 */
const updateBookValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('书名长度必须为 1-200 个字符'),
    body('author')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('作者长度必须为 1-100 个字符'),
    body('price')
        .optional()
        .isFloat({ min: 0.01, max: 999999.99 })
        .withMessage('价格必须为 0.01-999999.99 之间的数字'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('描述最多 2000 个字符')
];

// ==================== 消息验证规则 ====================

/**
 * 发送消息验证规则
 */
const sendMessageValidation = [
    body('receiver_id')
        .isInt({ min: 1 })
        .withMessage('接收者ID必须是正整数'),
    body('book_id')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('书籍ID必须是正整数'),
    body('content')
        .trim()
        .isLength({ min: 1, max: 2000 })
        .withMessage('消息内容长度必须为 1-2000 个字符')
];

// ==================== 交易验证规则 ====================

/**
 * 创建交易验证规则
 */
const createTransactionValidation = [
    body('book_id')
        .isInt({ min: 1 })
        .withMessage('书籍ID必须是正整数'),
    body('buyer_id')
        .isInt({ min: 1 })
        .withMessage('买家ID必须是正整数')
];

// ==================== 通用验证规则 ====================

/**
 * ID 参数验证规则
 * 用于验证 URL 中的 ID 参数
 */
const idParamValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID必须是正整数')
];

/**
 * 分页查询验证规则
 * 用于验证分页参数
 */
const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('页码必须是正整数'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('每页数量必须是 1-100 之间的整数')
];

// ==================== 导出 ====================

module.exports = {
    validate,
    // 用户验证
    registerValidation,
    loginValidation,
    updateUserValidation,
    // 书籍验证
    createBookValidation,
    updateBookValidation,
    // 消息验证
    sendMessageValidation,
    // 交易验证
    createTransactionValidation,
    // 通用验证
    idParamValidation,
    paginationValidation
};
