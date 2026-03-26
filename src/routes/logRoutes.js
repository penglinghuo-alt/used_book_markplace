/**
 * 日志路由
 * 定义与日志相关的 API 路由
 * 
 * 路由前缀: /api/logs
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const logger = require('../config/logger');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const logUploadsDir = path.join(process.cwd(), 'uploads', 'user-logs');
if (!fs.existsSync(logUploadsDir)) {
    fs.mkdirSync(logUploadsDir, { recursive: true });
}

/**
 * @route   POST /api/logs/upload
 * @desc    上传用户日志（用于问题排查）
 * @access  需要认证
 * 
 * 请求体：
 * - logType: 日志类型（'error' | 'client' | 'performance'）
 * - description: 问题描述
 * - logContent: 日志内容
 */
router.post(
    '/upload',
    auth,
    async (req, res) => {
        try {
            const { logType, description, logContent } = req.body;
            
            if (!logType || !logContent) {
                return res.status(400).json({
                    success: false,
                    message: '请提供日志类型和内容'
                });
            }

            const validLogTypes = ['error', 'client', 'performance', 'network', 'other'];
            if (!validLogTypes.includes(logType)) {
                return res.status(400).json({
                    success: false,
                    message: '无效的日志类型'
                });
            }

            if (logContent.length > 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    message: '日志内容过大，请控制在1MB以内'
                });
            }

            const timestamp = Date.now();
            const randomStr = crypto.randomBytes(4).toString('hex');
            const filename = `user_${req.user.id}_${timestamp}_${randomStr}.log`;
            const filepath = path.join(logUploadsDir, filename);

            const logEntry = {
                timestamp: new Date().toISOString(),
                userId: req.user.id,
                username: req.user.username || 'unknown',
                logType,
                description: description || '',
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent') || '',
                content: logContent
            };

            fs.writeFileSync(filepath, JSON.stringify(logEntry, null, 2), 'utf8');

            logger.info(`用户上传日志`, {
                userId: req.user.id,
                logType,
                filename,
                description
            });

            res.status(201).json({
                success: true,
                message: '日志上传成功',
                data: {
                    filename,
                    logType,
                    uploadedAt: logEntry.timestamp
                }
            });
        } catch (error) {
            logger.error(`日志上传失败`, { error: error.message });
            res.status(500).json({
                success: false,
                message: '日志上传失败'
            });
        }
    }
);

/**
 * @route   GET /api/logs/types
 * @desc    获取支持的日志类型
 * @access  公开
 */
router.get('/types', (req, res) => {
    res.json({
        success: true,
        data: {
            types: [
                { value: 'error', label: '错误日志', description: '前端错误、控制台报错等信息' },
                { value: 'client', label: '客户端日志', description: '客户端操作日志、调试信息' },
                { value: 'performance', label: '性能日志', description: '页面加载慢、接口响应慢等性能问题' },
                { value: 'network', label: '网络日志', description: '网络请求失败、API错误等信息' },
                { value: 'other', label: '其他', description: '其他问题描述' }
            ]
        }
    });
});

module.exports = router;