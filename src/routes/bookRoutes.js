/**
 * 书籍路由
 * 定义与书籍/挂售相关的 API 路由
 * 
 * 路由前缀: /api/books
 */

const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { auth } = require('../middleware/auth');
const { uploadBookImage } = require('../middleware/upload');
const {
    validate,
    createBookValidation,
    updateBookValidation,
    idParamValidation,
    paginationValidation
} = require('../middleware/validation');

/**
 * @route   POST /api/books
 * @desc    发布新书籍（创建挂售）
 * @access  需要认证
 */
router.post(
    '/',
    auth,
    validate(createBookValidation),
    bookController.createBook
);

/**
 * @route   POST /api/books/upload-image
 * @desc    上传书籍图片
 * @access  需要认证
 */
router.post(
    '/upload-image',
    auth,
    uploadBookImage.single('image'),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的图片'
            });
        }
        
        const imageUrl = `/uploads/books/${req.file.filename}`;
        
        res.json({
            success: true,
            message: '图片上传成功',
            data: {
                image_url: imageUrl
            }
        });
    }
);

/**
 * @route   GET /api/books
 * @desc    获取所有挂售中的书籍（支持搜索和分页）
 * @access  公开
 * 
 * 查询参数：
 * - page: 页码
 * - limit: 每页数量
 * - search: 搜索关键词
 * - status: 状态筛选
 */
router.get(
    '/',
    validate(paginationValidation),
    bookController.getBooks
);

/**
 * @route   GET /api/books/my
 * @desc    获取当前用户发布的所有书籍
 * @access  需要认证
 * 
 * 查询参数：
 * - status: 状态筛选（可选）
 */
router.get(
    '/my',
    auth,
    bookController.getMyBooks
);

/**
 * @route   GET /api/books/seller/:sellerId
 * @desc    获取指定卖家发布的所有书籍
 * @access  公开
 * 
 * 查询参数：
 * - status: 状态筛选（可选）
 */
router.get(
    '/seller/:sellerId',
    bookController.getBooksBySeller
);

/**
 * @route   GET /api/books/:id
 * @desc    获取单本书籍详情
 * @access  公开
 */
router.get(
    '/:id',
    validate(idParamValidation),
    bookController.getBookById
);

/**
 * @route   PUT /api/books/:id
 * @desc    更新书籍信息
 * @access  需要认证（仅卖家）
 */
router.put(
    '/:id',
    auth,
    validate([...idParamValidation, ...updateBookValidation]),
    bookController.updateBook
);

/**
 * @route   PATCH /api/books/:id/status
 * @desc    更新书籍状态
 * @access  需要认证（仅卖家）
 */
router.patch(
    '/:id/status',
    auth,
    validate(idParamValidation),
    bookController.updateBookStatus
);

/**
 * @route   DELETE /api/books/:id
 * @desc    删除书籍
 * @access  需要认证（仅卖家）
 */
router.delete(
    '/:id',
    auth,
    validate(idParamValidation),
    bookController.deleteBook
);

module.exports = router;
