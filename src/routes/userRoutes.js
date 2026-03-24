/**
 * 用户路由
 * 定义与用户相关的 API 路由
 * 
 * 路由前缀: /api/users
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { generateCaptcha, validateCaptcha } = require('../utils/captcha');
const { sendSmsCode, verifySmsCode } = require('../utils/sms');
const {
    validate,
    registerValidation,
    loginValidation,
    updateUserValidation,
    idParamValidation,
    paginationValidation
} = require('../middleware/validation');

/**
 * @route   GET /api/users/captcha
 * @desc    获取图形验证码
 * @access  公开
 */
router.get('/captcha', (req, res) => {
    const captcha = generateCaptcha();
    res.json({
        success: true,
        data: {
            token: captcha.token,
            captcha: captcha.data
        }
    });
});

/**
 * @route   POST /api/users/verify-captcha
 * @desc    验证验证码
 * @access  公开
 */
router.post('/verify-captcha', (req, res) => {
    const { token, userInput } = req.body;
    const isValid = validateCaptcha(token, userInput);
    res.json({
        success: isValid,
        message: isValid ? '验证成功' : '验证码错误'
    });
});

/**
 * @route   GET /api/users/stats
 * @desc    获取用户统计数据
 * @access  公开
 */
router.get('/stats', async (req, res) => {
    try {
        const db = require('../config/database');
        const userResult = await db.query('SELECT COUNT(*) as count FROM users');
        const bookResult = await db.query("SELECT COUNT(*) as count FROM books WHERE status = 'active'");
        res.json({
            success: true,
            data: {
                userCount: userResult[0]?.count || 0,
                bookCount: bookResult[0]?.count || 0
            }
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取统计数据失败'
        });
    }
});

/**
 * @route   POST /api/users/send-sms
 * @desc    发送短信验证码
 * @access  公开
 */
router.post('/send-sms', (req, res) => {
    const { phone } = req.body;
    
    if (!phone) {
        return res.status(400).json({
            success: false,
            message: '请输入手机号'
        });
    }
    
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({
            success: false,
            message: '手机号格式不正确'
        });
    }
    
    const result = sendSmsCode(phone);
    res.json(result);
});

/**
 * @route   POST /api/users/verify-sms
 * @desc    验证短信验证码
 * @access  公开
 */
router.post('/verify-sms', (req, res) => {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
        return res.status(400).json({
            success: false,
            message: '请输入手机号和验证码'
        });
    }
    
    const isValid = verifySmsCode(phone, code);
    res.json({
        success: isValid,
        message: isValid ? '验证成功' : '验证码错误'
    });
});

/**
 * @route   POST /api/users/reset-password
 * @desc    通过手机号重置密码
 * @access  公开
 */
router.post('/reset-password', async (req, res) => {
    const { phone, newPassword } = req.body;
    
    if (!phone || !newPassword) {
        return res.status(400).json({
            success: false,
            message: '请填写完整信息'
        });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: '密码长度至少为6位'
        });
    }
    
    try {
        const user = await User.findByPhone(phone);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '该手机号未绑定任何账户'
            });
        }
        
        await User.updatePassword(user.id, newPassword);
        res.json({
            success: true,
            message: '密码重置成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '密码重置失败'
        });
    }
});

/**
 * @route   GET /api/users/find-by-phone
 * @desc    通过手机号查找用户信息（用于找回密码）
 * @access  公开
 */
router.get('/find-by-phone', async (req, res) => {
    const { phone } = req.query;
    
    if (!phone) {
        return res.status(400).json({
            success: false,
            message: '请输入手机号'
        });
    }
    
    try {
        const user = await User.findByPhone(phone);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '该手机号未注册',
                data: { bound: false }
            });
        }
        
        res.json({
            success: true,
            message: '该手机号已绑定账户',
            data: { 
                bound: true,
                username: user.username.substring(0, 2) + '***' + user.username.substring(user.username.length - 1)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '查询失败'
        });
    }
});

/**
 * @route   POST /api/users/register
 * @desc    用户注册
 * @access  公开
 */
router.post(
    '/register',
    validate(registerValidation),
    userController.register
);

/**
 * @route   POST /api/users/login
 * @desc    用户登录
 * @access  公开
 */
router.post(
    '/login',
    validate(loginValidation),
    userController.login
);

/**
 * @route   GET /api/users/me
 * @desc    获取当前用户个人资料
 * @access  需要认证
 */
router.get(
    '/me',
    auth,
    userController.getProfile
);

/**
 * @route   PUT /api/users/me
 * @desc    更新当前用户个人资料
 * @access  需要认证
 */
router.put(
    '/me',
    auth,
    validate(updateUserValidation),
    userController.updateProfile
);

/**
 * @route   POST /api/users/me/phone
 * @desc    绑定或更新手机号
 * @access  需要认证
 */
router.post(
    '/me/phone',
    auth,
    async (req, res) => {
        const { phone } = req.body;
        
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: '请输入手机号'
            });
        }
        
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: '手机号格式不正确'
            });
        }
        
        try {
            const User = require('../models/User');
            const existingUser = await User.findByPhone(phone);
            if (existingUser && existingUser.id !== req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: '该手机号已被其他用户绑定'
                });
            }
            
            await User.updatePhone(req.user.id, phone);
            
            res.json({
                success: true,
                message: '手机号绑定成功'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '绑定失败'
            });
        }
    }
);

/**
 * @route   PUT /api/users/me/password
 * @desc    更新当前用户密码
 * @access  需要认证
 */
router.put(
    '/me/password',
    auth,
    userController.updatePassword
);

/**
 * @route   GET /api/users
 * @desc    获取所有用户列表（分页）
 * @access  需要认证
 */
router.get(
    '/',
    auth,
    validate(paginationValidation),
    userController.getAllUsers
);

/**
 * @route   GET /api/users/selection
 * @desc    获取用户列表（用于选择买家）
 * @access  需要认证
 */
router.get(
    '/selection',
    auth,
    userController.getUsersForSelection
);

/**
 * @route   GET /api/users/:id
 * @desc    获取指定用户公开资料
 * @access  需要认证
 */
router.get(
    '/:id',
    auth,
    validate(idParamValidation),
    userController.getUserById
);

/**
 * @route   POST /api/users/me/avatar
 * @desc    上传用户头像
 * @access  需要认证
 */
router.post(
    '/me/avatar',
    auth,
    upload.single('avatar'),
    userController.uploadAvatar
);

module.exports = router;
