# 1688 自动回复 Agent

阿里巴巴 1688 聊天窗口自动回复工具，使用 Playwright + AI 生成回复。

## 功能特性

- 🌐 **浏览器自动化** - 使用 Playwright 控制 1688 网页
- 🤖 **AI 智能回复** - 集成大模型生成专业客服回复
- 🔑 **关键词模板** - 也支持关键词匹配回复
- 💾 **登录态保存** - 一次登录，后续自动使用
- 🔄 **自动重连** - 错误过多时自动重启浏览器
- 🎯 **多目标客户** - 支持配置多个目标客户，只处理指定客户的消息
- 🌍 **多语言支持** - 根据客户语种提供相应的回复
- 🔄 **模式切换** - 支持简单模式（固定回复）和智能模式（AI 回复）
- 📋 **会话管理** - 处理完目标客户后自动切换到非目标客户会话
- ⏰ **时间记录** - 记录消息接收时间和回复生成时间

## 安装

```bash
cd 1688-agent
npm install
npx playwright install chromium --with-deps
```

## 配置

### 1. 主配置文件

编辑 `src/config.ts` 文件：

```typescript
export const config = {
  // AI 回复配置
  ai: {
    useBuiltin: true,  // 使用 OpenClaw 内置模型
    // 或使用外部 API
    // provider: 'openai',
    // apiKey: process.env.OPENAI_API_KEY,
  },

  // 回复策略
  reply: {
    mode: 'smart',  // 'simple'=简单模式, 'smart'=智能模式
    simpleReply: '我知道了，请您稍等。',  // 简单模式的固定回复
    systemPrompt: '你的系统提示词...',
    keywords: {
      '价格': '您好！具体价格请联系我们客服获取最新报价~',
      // 更多关键词...
    },
  },

  // 监控配置
  monitor: {
    intervalMs: 3000,  // 监控间隔（毫秒）
    maxErrors: 5,  // 最大错误次数
    targetCustomersFile: './data/target-customers.json',  // 目标客户配置文件路径
  },
};
```

### 2. 目标客户配置文件

编辑 `data/target-customers.json` 文件：

```json
{
  "customers": [
    {
      "name": "客户1",
      "enabled": true,
      "language": "zh"
    },
    {
      "name": "Customer2",
      "enabled": true,
      "language": "en"
    }
  ]
}
```

- `name`：客户名称，用于匹配会话中的客户昵称
- `enabled`：是否启用该客户的自动回复
- `language`：客户语种，支持 'zh'（中文）和 'en'（英文）

## 使用

```bash
# 启动 Agent
npm start

# 开发模式（热重载）
npm run dev
```

## 注意事项

1. **首次登录**：首次运行需要扫码登录 1688，登录态会保存到 `data/cookies.json`
2. **浏览器窗口**：默认会打开可见浏览器窗口，便于观察和调试
3. **反爬限制**：1688 可能需要滑动验证或扫码，Agent 会在需要时等待
4. **消息选择器**：1688 网页结构可能更新，如遇到选择器失效请反馈
5. **目标客户配置**：确保在 `data/target-customers.json` 中正确配置目标客户信息
6. **回复模式**：根据需要选择合适的回复模式，简单模式回复固定内容，智能模式使用 AI 生成回复

## 自定义选择器

如果 1688 页面更新，需要调整 `src/chat-monitor.ts` 中的选择器：

```typescript
const chatListSelector = [
  '.你的聊天列表选择器',
  '#你的ID',
];
```

## License

MIT
