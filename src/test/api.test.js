/**
 * API 接口测试脚本
 * 使用 Node.js 内置 http 模块测试 RESTful API
 * 
 * 运行方式：node src/test/api.test.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

// 颜色输出
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    reset: '\x1b[0m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`)
};

/**
 * 发送 HTTP 请求
 * @param {string} method - 请求方法
 * @param {string} path - 请求路径
 * @param {Object} data - 请求数据
 * @param {Object} headers - 请求头
 */
function request(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, data: json });
                } catch {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// 测试用例
const tests = {
    // 1. 健康检查
    async healthCheck() {
        log.info('测试: 健康检查 GET /api/health');
        try {
            const res = await request('GET', '/health');
            if (res.status === 200 && res.data.success) {
                log.success(`健康检查成功 - ${JSON.stringify(res.data)}`);
                return true;
            }
            log.error(`健康检查失败 - 状态码: ${res.status}`);
            return false;
        } catch (err) {
            log.error(`健康检查失败 - ${err.message}`);
            return false;
        }
    },

    // 2. 用户注册
    async register() {
        log.info('测试: 用户注册 POST /api/users/register');
        const userData = {
            username: 'testuser_' + Date.now(),
            password: '123456',
            bio: '这是一个测试用户',
            wechat_id: 'test_wechat_123'
        };
        try {
            const res = await request('POST', '/users/register', userData);
            if (res.status === 201 && res.data.success) {
                log.success(`注册成功 - 用户名: ${userData.username}`);
                global.testUser = { ...userData, ...res.data.data };
                global.token = res.data.data.token;
                return true;
            }
            log.error(`注册失败 - ${JSON.stringify(res.data)}`);
            return false;
        } catch (err) {
            log.error(`注册失败 - ${err.message}`);
            return false;
        }
    },

    // 3. 用户登录
    async login() {
        log.info('测试: 用户登录 POST /api/users/login');
        if (!global.testUser) {
            log.warn('没有测试用户数据，跳过登录测试');
            return false;
        }
        try {
            const res = await request('POST', '/users/login', {
                username: global.testUser.username,
                password: global.testUser.password
            });
            if (res.status === 200 && res.data.success) {
                log.success(`登录成功 - Token: ${res.data.data.token.substring(0, 20)}...`);
                global.token = res.data.data.token;
                return true;
            }
            log.error(`登录失败 - ${JSON.stringify(res.data)}`);
            return false;
        } catch (err) {
            log.error(`登录失败 - ${err.message}`);
            return false;
        }
    },

    // 4. 获取当前用户资料
    async getProfile() {
        log.info('测试: 获取个人资料 GET /api/users/me');
        if (!global.token) {
            log.warn('没有 Token，跳过此测试');
            return false;
        }
        try {
            const res = await request('GET', '/users/me', null, { Authorization: `Bearer ${global.token}` });
            if (res.status === 200 && res.data.success) {
                log.success(`获取成功 - 用户: ${JSON.stringify(res.data.data.user)}`);
                return true;
            }
            log.error(`获取失败 - ${JSON.stringify(res.data)}`);
            return false;
        } catch (err) {
            log.error(`获取失败 - ${err.message}`);
            return false;
        }
    },

    // 5. 创建书籍
    async createBook() {
        log.info('测试: 发布书籍 POST /api/books');
        if (!global.token) {
            log.warn('没有 Token，跳过此测试');
            return false;
        }
        const bookData = {
            title: '高等数学（第七版）',
            author: '同济大学数学系',
            price: 35.00,
            description: '九成新，封面有轻微磨损，内页干净整洁'
        };
        try {
            const res = await request('POST', '/books', bookData, { Authorization: `Bearer ${global.token}` });
            if (res.status === 201 && res.data.success) {
                log.success(`发布成功 - 书籍ID: ${res.data.data.book.id}`);
                global.testBook = res.data.data.book;
                return true;
            }
            log.error(`发布失败 - ${JSON.stringify(res.data)}`);
            return false;
        } catch (err) {
            log.error(`发布失败 - ${err.message}`);
            return false;
        }
    },

    // 6. 获取书籍列表
    async getBooks() {
        log.info('测试: 获取书籍列表 GET /api/books');
        try {
            const res = await request('GET', '/books?page=1&limit=10&search=高等数学');
            if (res.status === 200 && res.data.success) {
                log.success(`获取成功 - 共 ${res.data.data.books.length} 本书`);
                return true;
            }
            log.error(`获取失败 - ${JSON.stringify(res.data)}`);
            return false;
        } catch (err) {
            log.error(`获取失败 - ${err.message}`);
            return false;
        }
    },

    // 7. 获取单本书籍详情
    async getBookById() {
        log.info('测试: 获取书籍详情 GET /api/books/:id');
        if (!global.testBook) {
            log.warn('没有测试书籍数据，跳过此测试');
            return false;
        }
        try {
            const res = await request('GET', `/books/${global.testBook.id}`);
            if (res.status === 200 && res.data.success) {
                log.success(`获取成功 - ${JSON.stringify(res.data.data.book.title)}`);
                return true;
            }
            log.error(`获取失败 - ${JSON.stringify(res.data)}`);
            return false;
        } catch (err) {
            log.error(`获取失败 - ${err.message}`);
            return false;
        }
    },

    // 8. 发送私信
    async sendMessage() {
        log.info('测试: 发送私信 POST /api/messages');
        if (!global.token || !global.testUser) {
            log.warn('没有 Token 或用户，跳过此测试');
            return false;
        }
        try {
            const res = await request('POST', '/messages', {
                receiver_id: global.testUser.id,
                book_id: global.testBook?.id || null,
                content: '你好，我想咨询一下这本书的情况'
            }, { Authorization: `Bearer ${global.token}` });
            if (res.status === 201 && res.data.success) {
                log.success(`发送成功 - 消息ID: ${res.data.data.message.id}`);
                global.testMessage = res.data.data.message;
                return true;
            }
            log.error(`发送失败 - ${JSON.stringify(res.data)}`);
            return false;
        } catch (err) {
            log.error(`发送失败 - ${err.message}`);
            return false;
        }
    },

    // 9. 创建交易记录
    async createTransaction() {
        log.info('测试: 创建交易记录 POST /api/transactions');
        if (!global.token || !global.testBook) {
            log.warn('没有 Token 或书籍，跳过此测试');
            return false;
        }
        try {
            const res = await request('POST', '/transactions', {
                book_id: global.testBook.id,
                buyer_id: global.testUser.id
            }, { Authorization: `Bearer ${global.token}` });
            if (res.status === 201 && res.data.success) {
                log.success(`创建成功 - 交易ID: ${res.data.data.transaction.id}`);
                global.testTransaction = res.data.data.transaction;
                return true;
            }
            log.error(`创建失败 - ${JSON.stringify(res.data)}`);
            return false;
        } catch (err) {
            log.error(`创建失败 - ${err.message}`);
            return false;
        }
    }
};

// 主测试函数
async function runTests() {
    console.log('\n========================================');
    console.log('  二手书交易平台 API 接口测试');
    console.log('========================================\n');

    // 先检查服务是否运行
    log.info('正在检查 API 服务状态...\n');
    
    const results = [];
    
    // 执行测试
    const testNames = [
        { name: '健康检查', fn: tests.healthCheck },
        { name: '用户注册', fn: tests.register },
        { name: '用户登录', fn: tests.login },
        { name: '获取个人资料', fn: tests.getProfile },
        { name: '发布书籍', fn: tests.createBook },
        { name: '获取书籍列表', fn: tests.getBooks },
        { name: '获取书籍详情', fn: tests.getBookById },
        { name: '发送私信', fn: tests.sendMessage },
        { name: '创建交易记录', fn: tests.createTransaction }
    ];

    for (const test of testNames) {
        try {
            const success = await test.fn();
            results.push({ name: test.name, success });
        } catch (err) {
            results.push({ name: test.name, success: false, error: err.message });
        }
        await new Promise(r => setTimeout(r, 100)); // 避免请求过快
    }

    // 输出结果汇总
    console.log('\n========================================');
    console.log('  测试结果汇总');
    console.log('========================================\n');

    let passed = 0;
    let failed = 0;

    for (const r of results) {
        if (r.success) {
            log.success(r.name);
            passed++;
        } else {
            log.error(r.name + (r.error ? ` - ${r.error}` : ''));
            failed++;
        }
    }

    console.log(`\n总计: ${passed} 通过, ${failed} 失败\n`);

    if (failed === 0) {
        console.log(`${colors.green}🎉 所有接口测试通过！${colors.reset}\n`);
    } else {
        console.log(`${colors.yellow}⚠ 部分接口测试失败，请检查服务配置${colors.reset}\n`);
    }
}

// 运行测试
runTests().catch(console.error);
