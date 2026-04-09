# 1688 自动回复 Agent

阿里巴巴 1688 聊天窗口自动回复工具，使用 Playwright + AI 生成回复。

## 功能特性

- 🌐 **浏览器自动化** - 使用 Playwright 控制 1688 网页
- 🤖 **AI 智能回复** - 集成大模型生成专业客服回复
- 🔑 **关键词模板** - 也支持关键词匹配回复
- 💾 **登录态保存** - 一次登录，后续自动使用
- 🔄 **自动重连** - 错误过多时自动重启浏览器

## 安装

```bash
cd 1688-agent
npm install
npx playwright install chromium --with-deps
```

## 配置

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
    useAI: true,  // true=AI生成, false=关键词匹配
    systemPrompt: '你的系统提示词...',
    keywords: {
      '价格': '您好！具体价格请联系我们客服获取最新报价~',
      // 更多关键词...
    },
  },

  // 监控间隔（毫秒）
  monitor: {
    intervalMs: 3000,
  },
};
```

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
# 1688-agent
# 1688-agent
