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

[明天新任务：继续部署二手书项目]
- Date: 2026-03-24
- Context: 用户明确要求明天直接告诉新的任务
- Instructions:
  - 继续部署二手书项目，执行下面的部署步骤并验证功能
  - 后端部署命令：
    cd /www/wwwroot/used-book-marketplace && git pull && npm install && pkill -f "node src/app.js" || true && source ~/.bashrc && nvm use 20 && node src/app.js &
  - 前端部署命令：
    cd /www/wwwroot/used-book-marketplace/frontend && git pull && source ~/.bashrc && nvm use 20 && npm run build && nginx -s reload
  - 已实现功能：
    - 用户注册/登录（中文用户名、图形验证码）
    - 头像上传
    - 修改用户名、密码、个人资料
    - 聊天功能
    - 书籍发布/购买
    - 狐妖小红娘主题（粉色樱花）
    - 夜间模式
  - 待完善：
    - 验证码机器人测试（已添加功能）
    - 聊天功能完整流程测试
