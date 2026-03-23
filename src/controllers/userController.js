/**
 * 用户控制器
 * 处理与用户相关的 HTTP 请求
 * 
 * 功能说明：
 * - 用户注册
 * - 用户登录
 * - 获取个人资料
 * - 更新个人资料
 */

const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { validateCaptcha } = require('../utils/captcha');
const logger = require('../config/logger');

/**
 * 用户注册
 * POST /api/users/register
 * 
 * 请求体：
 * {
 *   "username": "用户名",
 *   "password": "密码",
 *   "bio": "个性签名(可选)",
 *   "wechat_id": "微信ID(可选)",
 *   "captchaToken": "验证码Token",
 *   "captchaInput": "用户输入的验证码"
 * }
 */
const register = asyncHandler(async (req, res) => {
    const { username, password, bio, wechat_id, captchaToken, captchaInput } = req.body;
    
    if (!captchaToken || !captchaInput) {
        throw new AppError('请输入验证码', 400);
    }
    
    if (!validateCaptcha(captchaToken, captchaInput)) {
        throw new AppError('验证码错误', 400);
    }
    
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
        throw new AppError('用户名已存在', 400);
    }
    
    const user = await User.create({
        username,
        password,
        bio: bio || '',
        wechat_id: wechat_id || null
    });
    
    const token = generateToken({ userId: user.id });
    
    logger.info(`用户注册成功`, { userId: user.id, username });
    
    res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
            user: {
                id: user.id,
                username: user.username,
                bio: user.bio,
                wechat_id: user.wechat_id,
                created_at: user.created_at
            },
            token
        }
    });
});

/**
 * 用户登录
 * POST /api/users/login
 * 
 * 请求体：
 * {
 *   "username": "用户名",
 *   "password": "密码",
 *   "captchaToken": "验证码Token",
 *   "captchaInput": "用户输入的验证码"
 * }
 */
const login = asyncHandler(async (req, res) => {
    const { username, password, captchaToken, captchaInput } = req.body;
    
    if (!captchaToken || !captchaInput) {
        throw new AppError('请输入验证码', 400);
    }
    
    if (!validateCaptcha(captchaToken, captchaInput)) {
        throw new AppError('验证码错误', 400);
    }
    
    const user = await User.findByUsername(username);
    if (!user) {
        throw new AppError('用户名或密码错误', 401);
    }
    
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
        throw new AppError('用户名或密码错误', 401);
    }
    
    const token = generateToken({ userId: user.id });
    
    logger.info(`用户登录成功`, { userId: user.id, username });
    
    res.status(200).json({
        success: true,
        message: '登录成功',
        data: {
            user: {
                id: user.id,
                username: user.username,
                bio: user.bio,
                wechat_id: user.wechat_id,
                created_at: user.created_at
            },
            token
        }
    });
});

/**
 * 获取当前用户个人资料
 * GET /api/users/me
 * 需要认证
 */
const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
        throw new AppError('用户不存在', 404);
    }
    
    res.status(200).json({
        success: true,
        data: {
            user: {
                id: user.id,
                username: user.username,
                bio: user.bio,
                wechat_id: user.wechat_id,
                avatar_url: user.avatar_url,
                created_at: user.created_at
            }
        }
    });
});

/**
 * 获取指定用户公开资料
 * GET /api/users/:id
 * 需要认证
 */
const getUserById = asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    
    const user = await User.findById(userId);
    
    if (!user) {
        throw new AppError('用户不存在', 404);
    }
    
    res.status(200).json({
        success: true,
        data: {
            user: {
                id: user.id,
                username: user.username,
                bio: user.bio,
                avatar_url: user.avatar_url,
                created_at: user.created_at
            }
        }
    });
});

/**
 * 获取所有用户列表（分页）
 * GET /api/users
 * 需要认证
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await User.findAll(page, limit);
    
    res.status(200).json({
        success: true,
        data: result
    });
});

/**
 * 更新当前用户个人资料
 * PUT /api/users/me
 * 需要认证
 * 
 * 请求体：
 * {
 *   "bio": "新的个性签名",
 *   "wechat_id": "新的微信ID"
 * }
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { bio, wechat_id } = req.body;
    
    const success = await User.update(req.user.id, {
        bio,
        wechat_id
    });
    
    if (!success) {
        throw new AppError('没有要更新的内容', 400);
    }
    
    const updatedUser = await User.findById(req.user.id);
    
    logger.info(`用户资料更新`, { userId: req.user.id });
    
    res.status(200).json({
        success: true,
        message: '资料更新成功',
        data: {
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                bio: updatedUser.bio,
                wechat_id: updatedUser.wechat_id,
                avatar_url: updatedUser.avatar_url,
                created_at: updatedUser.created_at
            }
        }
    });
});

/**
 * 更新当前用户密码
 * PUT /api/users/me/password
 * 需要认证
 * 
 * 请求体：
 * {
 *   "oldPassword": "原密码",
 *   "newPassword": "新密码"
 * }
 */
const updatePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    
    // 获取当前用户信息
    const user = await User.findById(req.user.id);
    if (!user) {
        throw new AppError('用户不存在', 404);
    }
    
    // 验证原密码
    const isValidPassword = await User.verifyPassword(oldPassword, user.password_hash);
    if (!isValidPassword) {
        throw new AppError('原密码错误', 400);
    }
    
    // 更新密码
    await User.updatePassword(req.user.id, newPassword);
    
    logger.info(`用户密码更新`, { userId: req.user.id });
    
    res.status(200).json({
        success: true,
        message: '密码更新成功'
    });
});

const uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError('请选择要上传的头像图片', 400);
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    await User.update(req.user.id, {
        avatar_url: avatarUrl
    });

    logger.info(`用户头像更新成功`, { userId: req.user.id, avatarUrl });

    res.status(200).json({
        success: true,
        message: '头像上传成功',
        data: {
            avatar_url: avatarUrl
        }
    });
});

module.exports = {
    register,
    login,
    getProfile,
    getUserById,
    getAllUsers,
    updateProfile,
    updatePassword,
    uploadAvatar
};
