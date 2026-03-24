const multer = require('multer');
const path = require('path');
const fs = require('fs');

const avatarUploadDir = path.join(__dirname, '../../uploads/avatars');
const bookUploadDir = path.join(__dirname, '../../uploads/books');

[avatarUploadDir, bookUploadDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarUploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `avatar_${req.user.id}_${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const bookStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, bookUploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('只支持 JPG、PNG、GIF、WebP 格式的图片'), false);
    }
};

const upload = multer({
    storage: avatarStorage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024
    }
});

const uploadBookImage = multer({
    storage: bookStorage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = { upload, uploadBookImage };