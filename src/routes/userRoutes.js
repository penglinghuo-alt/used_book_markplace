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
const upload = require('../middleware/upload');
const {
    validate,
    registerValidation,
    loginValidation,
    updateUserValidation,
    idParamValidation,
    paginationValidation
} = require('../middleware/validation');

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
