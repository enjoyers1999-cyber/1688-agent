import { config } from './config.js';

// 简单模式回复生成器
export class SimpleReply {
  // 生成回复
  async generateReply(customerMessage: string): Promise<string> {
    console.log('📝 简单模式回复');
    return config.reply.simpleReply;
  }
}