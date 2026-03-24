# 用户指令记忆

本文件记录了用户的指令、偏好和教导，用于在未来的交互中提供参考。

## 格式

### 用户指令条目
用户指令条目应遵循以下格式：

[用户指令摘要]
- Date: [YYYY-MM-DD]
- Context: [提及的场景或时间]
- Instructions:
  - [用户教导或指示的内容，逐行描述]

### 项目知识条目
Agent 在任务执行过程中发现的条目应遵循以下格式：

[项目知识摘要]
- Date: [YYYY-MM-DD]
- Context: Agent 在执行 [具体任务描述] 时发现
- Category: [代码结构|代码模式|代码生成|构建方法|测试方法|依赖关系|环境配置]
- Instructions:
  - [具体的知识点，逐行描述]

## 去重策略
- 添加新条目前，检查是否存在相似或相同的指令
- 若发现重复，跳过新条目或与已有条目合并
- 合并时，更新上下文或日期信息
- 这有助于避免冗余条目，保持记忆文件整洁

## 条目

### 2026-03-25 待继续功能

[二手书项目当前进度和待完成功能]
- Date: 2026-03-25
- Context: 用户睡觉前记录待完成功能
- 待完成功能：
  1. **消息功能完善** - 聊天功能完整流程测试
  2. **好友功能** - 好友功能基本完成，需测试
  3. **书籍分类** - 分类功能已添加，教辅/课本/笔记本/其他
  4. **实时统计** - 首页显示注册用户数和书籍数
  5. **安全性测试** - 限流、CSP等安全措施已添加
  6. **验证码机器人测试** - 图形验证码功能已实现
  7. **其他可能的需求** - 用户睡觉前提到还有功能要修改

- 已完成功能：
  - 用户注册/登录（中文用户名、图形验证码）
  - 头像上传
  - 修改用户名、密码、个人资料
  - 手机号绑定/找回密码
  - 聊天功能（需成为好友后才能聊天）
  - 好友功能（申请、同意/拒绝、好友列表）
  - 书籍发布/购买
  - 书籍分类（教辅/课本/笔记本/其他）
  - 狐妖小红娘主题（粉色樱花、樱花飘落特效）
  - 夜间模式
  - 网站安全措施（限流、CSP、安全Headers）

- 部署命令：
  ```bash
  # 后端
  cd /www/wwwroot/used-book-marketplace && git pull && pkill -f "node src/app.js" || true && source ~/.bashrc && nvm use 20 && node src/app.js &

  # 前端
  cd /www/wwwroot/used-book-marketplace/frontend && git pull && source ~/.bashrc && nvm use 20 && npm run build && nginx -s reload
  ```

- 项目路径：
  - 后端：/www/wwwroot/used-book-marketplace
  - 前端：/www/wwwroot/used-book-marketplace/frontend
  - 仓库：https://github.com/penglinghuo-alt/used_book_markplace.git

### 2026-03-24 首次任务

[二手书项目部署]
- Date: 2026-03-24
- Context: 用户要求继续部署二手书项目
- Instructions:
  - 继续部署二手书项目，执行下面的部署步骤并验证功能
