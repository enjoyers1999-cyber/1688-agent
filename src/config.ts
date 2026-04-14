// 1688 自动回复 Agent 配置

export const config = {
  // 1688 登录信息（建议使用环境变量）
  1688: {
    loginUrl: 'https://login.1688.com/member/signin.htm',
    // chatUrl: 'https://work.1688.com/msg/index.htm', // 消息中心
    chatUrl: 'https://air.1688.com/app/ocms-fusion-components-1688/def_cbu_web_im/index.html' ,
    // 如果已经保存登录态，可以指定 cookie 文件路径
    cookiesFile: './data/cookies.json',
  },

  // AI 回复配置
  ai: {
    // 使用 OpenClaw 内置模型（默认）
    useBuiltin: true,
    // 或使用外部 API（如需要）
    // provider: 'openai',
    // apiKey: process.env.OPENAI_API_KEY,
    // model: 'gpt-4',
  },

  // 回复策略
  reply: {
    // 是否启用 AI 智能生成（false 则使用关键词模板）
    useAI: true,
    // AI 系统提示词
    systemPrompt: `你是一个产品采购助手。请通过与商家聊天咨询商品的情况。请根据历史对话内容，生成回复。
注意事项：
1. 回复要简洁，不超过100字
2. 咨询商品的材质（安全环保、国标）
3. 咨询商品的价格（折扣优惠）
4. 咨询商品的售后（安装、保修、退货等）
5. 咨询商品的发货时间
6. 保持礼貌和专业,`,
    // 关键词模板（useAI=false 时使用）
    keywords: {
      '价格': '您好！有没有折扣',
      '发货': '什么时候发货？',
      '退换': '退货处理？',
      '批发': '批发业务请联系客服，大单有优惠~'
    },
    // 兜底回复
    defaultReply: '好的',
    // AI 回复时的最大等待时间（毫秒）
    aiTimeout: 60000,
  },

  // 监控配置
  monitor: {
    // 检查新消息的间隔（毫秒）
    intervalMs: 3000,
    // 最大连续错误次数，超过后重启浏览器
    maxErrors: 5,
    // 目标客户配置文件路径
    targetCustomersFile: './data/target-customers.json',
  },

  // 日志
  log: {
    level: 'info', // debug, info, warn, error
    file: './data/agent.log',
  },
};
