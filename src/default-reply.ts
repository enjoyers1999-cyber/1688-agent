import { config } from './config.js';

// 默认回复生成器
export class DefaultReply {
  // 根据语种获取默认回复
  getDefaultReply(language: string = 'zh'): string {
    switch (language) {
      case 'en':
        return 'I understand, please wait a moment.';
      case 'zh':
      default:
        return config.reply.simpleReply;
    }
  }
}