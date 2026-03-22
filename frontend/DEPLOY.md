# 部署说明

## 方式一：通过宝塔部署

### 1. 构建生产版本
```bash
cd frontend
npm install
npm run build
```

构建完成后，dist 目录即为静态文件。

### 2. 上传到宝塔
将 `dist` 目录下的所有文件上传到宝塔网站的根目录。

### 3. 配置 Nginx 反向代理
在宝塔 Nginx 配置中添加反向代理，将 API 请求转发到后端：

```nginx
location /api {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

### 4. 环境变量配置
如果需要单独配置 API 地址，创建 `.env.production` 文件：
```
VITE_API_URL=http://120.24.189.110:3000
```

---

## 方式二：通过预览链接访问

当前预览地址已配置为开发服务器代理：
- 前端：http://120.24.189.110（需要通过宝塔部署）
- 后端 API：http://120.24.189.110:3000

---

## 目录结构

```
/www/wwwroot/used-book-marketplace/
├── backend/          # 后端 Node.js 代码
│   ├── src/
│   ├── package.json
│   └── .env
│
└── frontend-dist/   # 前端构建产物
    ├── index.html
    ├── assets/
    └── ...
```
