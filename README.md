# 二手书交易平台后端 API

基于 Node.js + Express + MySQL 的二手书交易平台后端服务。

## 功能特性

- **用户系统**: 注册、登录、个人资料管理
- **书籍挂售**: 发布、搜索、筛选、管理书籍
- **私信功能**: 用户间一对一聊天
- **交易记录**: 卖家确认售出、交易历史、统计

## 技术栈

- Node.js
- Express.js
- MySQL
- JWT (JSON Web Token)
- bcryptjs (密码加密)
- express-validator (输入验证)
- Winston (日志)

## 项目结构

```
used-book-marketplace/
├── src/
│   ├── config/          # 配置文件
│   │   ├── database.js  # 数据库配置
│   │   └── logger.js    # 日志配置
│   ├── controllers/     # 控制器
│   │   ├── userController.js
│   │   ├── bookController.js
│   │   ├── messageController.js
│   │   └── transactionController.js
│   ├── middleware/      # 中间件
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── models/          # 数据模型
│   │   ├── User.js
│   │   ├── Book.js
│   │   ├── Message.js
│   │   └── Transaction.js
│   ├── routes/          # 路由定义
│   │   ├── index.js
│   │   ├── userRoutes.js
│   │   ├── bookRoutes.js
│   │   ├── messageRoutes.js
│   │   └── transactionRoutes.js
│   ├── utils/           # 工具函数
│   │   └── validators.js
│   └── app.js           # 应用入口
├── .env                 # 环境变量
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

编辑 `.env` 文件，配置数据库连接信息：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=used_book_marketplace
JWT_SECRET=your_jwt_secret
PORT=3000
```

### 3. 创建数据库

在 MySQL 中创建数据库：

```sql
CREATE DATABASE used_book_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm start
```

服务启动后会自动创建所需的数据库表。

## API 接口文档

### 用户接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/users/register | 用户注册 | 否 |
| POST | /api/users/login | 用户登录 | 否 |
| GET | /api/users/me | 获取当前用户资料 | 是 |
| PUT | /api/users/me | 更新个人资料 | 是 |
| PUT | /api/users/me/password | 修改密码 | 是 |
| GET | /api/users | 获取用户列表 | 是 |
| GET | /api/users/:id | 获取指定用户资料 | 是 |

### 书籍接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/books | 发布书籍 | 是 |
| GET | /api/books | 获取书籍列表 | 否 |
| GET | /api/books/my | 获取我发布的书籍 | 是 |
| GET | /api/books/seller/:id | 获取指定卖家书籍 | 否 |
| GET | /api/books/:id | 获取书籍详情 | 否 |
| PUT | /api/books/:id | 更新书籍信息 | 是 |
| PATCH | /api/books/:id/status | 更新书籍状态 | 是 |
| DELETE | /api/books/:id | 删除书籍 | 是 |

### 消息接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/messages | 发送私信 | 是 |
| GET | /api/messages/conversations | 获取会话列表 | 是 |
| GET | /api/messages/conversation/:id | 获取聊天记录 | 是 |
| GET | /api/messages/book/:id | 获取书籍相关消息 | 是 |
| GET | /api/messages/:id | 获取消息详情 | 是 |
| DELETE | /api/messages/:id | 删除消息 | 是 |

### 交易接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/transactions | 创建交易记录 | 是 |
| GET | /api/transactions | 获取我的交易记录 | 是 |
| GET | /api/transactions/stats | 获取我的销售统计 | 是 |
| GET | /api/transactions/:id | 获取交易详情 | 是 |
| GET | /api/transactions/book/:id | 获取书籍交易记录 | 是 |

## 数据表结构

### users (用户表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 用户ID |
| username | VARCHAR(50) | 用户名 |
| password_hash | VARCHAR(255) | 密码哈希 |
| bio | VARCHAR(255) | 个性签名 |
| wechat_id | VARCHAR(100) | 微信联系方式 |
| created_at | TIMESTAMP | 创建时间 |

### books (书籍表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 书籍ID |
| seller_id | INT | 卖家ID |
| title | VARCHAR(200) | 书名 |
| author | VARCHAR(100) | 作者 |
| price | DECIMAL(10,2) | 价格 |
| description | TEXT | 描述/新旧程度 |
| status | ENUM | 状态(active/sold) |
| created_at | TIMESTAMP | 挂售时间 |

### messages (私信表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 消息ID |
| sender_id | INT | 发送者ID |
| receiver_id | INT | 接收者ID |
| book_id | INT | 关联书籍ID |
| content | TEXT | 消息内容 |
| sent_at | TIMESTAMP | 发送时间 |

### transactions (交易记录表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 交易ID |
| book_id | INT | 书籍ID |
| buyer_id | INT | 买家ID |
| seller_id | INT | 卖家ID |
| completed_at | TIMESTAMP | 完成时间 |

## 使用示例

### 注册用户

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "123456", "bio": "爱看书"}'
```

### 登录

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "123456"}'
```

### 发布书籍（需认证）

```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title": "高等数学", "author": "同济大学", "price": 25.00, "description": "九成新"}'
```

## 部署到宝塔

1. 将项目文件上传到宝塔的网站目录
2. 配置 `.env` 中的数据库连接（使用宝塔的 MySQL）
3. 运行 `npm install` 安装依赖
4. 使用 PM2 或直接 `npm start` 启动服务
5. 绑定域名或通过 IP:端口 访问

## License

ISC
