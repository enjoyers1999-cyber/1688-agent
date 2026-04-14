import { config } from './config.js';

// AI 回复生成器
export class AIReply {
  private useAI: boolean;

  constructor() {
    this.useAI = config.reply.mode === 'smart';
  }

  // 生成回复
  async generateReply(customerMessage: string): Promise<string> {
    if (!this.useAI) {
      return this.keywordReply(customerMessage);
    }

    try {
      return await this.aiGenerateReply(customerMessage);
    } catch (error) {
      console.error('❌ AI 生成回复失败，使用关键词匹配:', error);
      return this.keywordReply(customerMessage);
    }
  }

  // 关键词匹配回复
  private keywordReply(message: string): string {
    const keywords = config.reply.keywords;
    const lowerMessage = message.toLowerCase();

    for (const [keyword, reply] of Object.entries(keywords)) {
      if (lowerMessage.includes(keyword)) {
        return reply;
      }
    }

    return config.reply.defaultReply;
  }

  // 使用 AI 生成回复（调用 OpenClaw 内置模型）
  private async aiGenerateReply(customerMessage: string): Promise<string> {
    // 检查 OpenClaw API 是否可用
    try {
      const systemPrompt = config.reply.systemPrompt;
      const timeout = config.reply.aiTimeout || 10000;

      // 从环境变量或配置文件获取 OpenClaw Token
      const openclawToken = process.env.OPENCLAW_TOKEN;
      if (!openclawToken) {
        console.warn('⚠️ 未设置 OPENCLAW_TOKEN 环境变量，尝试无认证调用');
      }

      // 构建请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (openclawToken) {
        headers['Authorization'] = `Bearer ${openclawToken}`;
      }

      // 尝试调用 OpenClaw 内置 API
      // 注意：需要在 OpenClaw 配置中启用 gateway.http.endpoints.chatCompletions.enabled: true
      // OpenClaw 模型格式：openclaw 或 openclaw/<agentId>
      const response = await Promise.race([
        fetch('http://localhost:18789/v1/chat/completions', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: 'openclaw',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: '我是1688_agent,对话内容如下：' + customerMessage },
            ],
            max_tokens: 150,
            temperature: 0.7,
          }),
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI 请求超时')), timeout)
        ),
      ]);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API 错误: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenClaw API 调用失败:', error);
      console.error('请确保：');
      console.error('1. 在 OpenClaw 配置中启用了 gateway.http.endpoints.chatCompletions.enabled: true');
      console.error('2. 设置了 OPENCLAW_TOKEN 环境变量（可通过 openclaw config get gateway.auth.token 获取）');
      // 回退到关键词匹配
      return this.keywordReply(customerMessage);
    }
  }
}
