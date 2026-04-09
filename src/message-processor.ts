// 消息处理器
import { AIReply } from './ai-reply.js';
import { parseMessageTime } from './utils/time-utils.js';
import { CacheManager } from './utils/cache-manager.js';

export interface Message {
  name: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'file' | 'other';
  isImportant: boolean;
}

export class MessageProcessor {
  private aiReply: AIReply;
  private cacheManager: CacheManager;

  constructor() {
    this.aiReply = new AIReply();
    this.cacheManager = new CacheManager('analysis-cache.json');
  }
  // 加载历史消息
  async loadHistoryMessages(chatFrame: any): Promise<string> {
    if (!chatFrame) {
      return '';
    }

    try {
      // 查找所有 class='message-item' 的 div
      const messageItems = await chatFrame.$$('div.message-item');
      console.log(`找到 ${messageItems.length} 条历史消息`);

      const messages: Message[] = [];

      for (const item of messageItems) {
        try {
          // 提取 name（说话主体）
          const nameEl = await item.$('.nick');
          const name = nameEl ? await nameEl.textContent() : '未知';

          // 提取 content（说的内容）
          let content = '';
          let type: 'text' | 'image' | 'file' | 'other' = 'text';
          
          // 尝试多种内容选择器
          const contentEl = await item.$('.edit, .content pre, .content');
          if (contentEl) {
            content = await contentEl.textContent() || '';
          }
          
          // 检查是否为图片消息
          const antImageEl = await item.$('div.ant-image');
          let imageEl;
          if (antImageEl) {
            // 从 class="ant-image" 的 div 中查找 img
            imageEl = await antImageEl.$('img.ant-image-img');
          } 
          
          if (imageEl) {
            type = 'image';
            if (!content) content = '[图片]';
            // 提取图片URL并调用AI分析图片内容
            try {
              const imageSrc = await imageEl.getAttribute('src');
              if (imageSrc) {
                console.log(`🔍 发现图片: ${imageSrc}`);
                // 调用AI分析图片内容
                const imageDescription = await this.analyzeImageContent(imageSrc);
                if (imageDescription) {
                  content = `[图片] ${imageDescription}`;
                }
              }
            } catch (error) {
              console.error('❌ 图片分析失败:', error);
            }
          }
          
          // 检查是否为文件消息
          const fileEl = await item.$('[class*="file"], a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"]');
          if (fileEl) {
            type = 'file';
            if (!content) content = '[文件]';
            // 提取文件URL并调用AI分析文件内容
            try {
              const fileUrl = await fileEl.getAttribute('href');
              if (fileUrl) {
                console.log(`🔍 发现文件: ${fileUrl}`);
                // 调用AI分析文件内容
                const fileDescription = await this.analyzeFileContent(fileUrl);
                if (fileDescription) {
                  content = `[文件] ${fileDescription}`;
                }
              }
            } catch (error) {
              console.error('❌ 文件分析失败:', error);
            }
          }

          // 提取时间戳（如果有）
          let timestamp = Date.now();
          const timeEl = await item.$('[class*="time"], .time');
          if (timeEl) {
            const timeText = await timeEl.textContent();
            if (timeText) {
              // 简单的时间解析，实际应用中可能需要更复杂的逻辑
              timestamp = parseMessageTime(timeText);
            }
          }

          // 判断消息重要性
          const isImportant = this.isImportantMessage(content, type);

          if (name && (content || type !== 'text')) {
            messages.push({ name, content, timestamp, type, isImportant });
          }
        } catch (e) {
          // 忽略单个消息提取错误
        }
      }

      // 按时间戳排序，确保消息顺序正确
      messages.sort((a, b) => a.timestamp - b.timestamp);

      // 过滤重复消息
      const uniqueMessages = this.filterDuplicateMessages(messages);

      // 限制消息数量，保留最近的消息
      const recentMessages = uniqueMessages.slice(-50); // 保留最近的50条消息

      // 基于重要性和相关性排序
      const prioritizedMessages = this.prioritizeMessages(recentMessages);

      // 格式化消息
      const formattedMessages = prioritizedMessages.map(msg => {
        let formattedContent = msg.content;
        if (msg.type === 'image') {
          formattedContent = `[图片] ${formattedContent}`;
        } else if (msg.type === 'file') {
          formattedContent = `[文件] ${formattedContent}`;
        }
        return `${msg.name}: ${formattedContent}`;
      });

      // 输出格式化后的消息以便调试
      console.log('📝 格式化后的消息:', formattedMessages);

      return formattedMessages.join('\n');
    } catch (error) {
      console.log('加载历史消息失败:', error);
      return '';
    }
  }

  // 解析消息时间
  private parseMessageTime(timeText: string): number {
    // 简单的时间解析逻辑，实际应用中可能需要更复杂的处理
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 处理 "今天 12:34" 格式
    if (timeText.includes('今天')) {
      const timePart = timeText.replace('今天', '').trim();
      const [hours, minutes] = timePart.split(':').map(Number);
      const date = new Date(today);
      date.setHours(hours, minutes, 0, 0);
      return date.getTime();
    }
    
    // 处理 "昨天 12:34" 格式
    if (timeText.includes('昨天')) {
      const timePart = timeText.replace('昨天', '').trim();
      const [hours, minutes] = timePart.split(':').map(Number);
      const date = new Date(today);
      date.setDate(date.getDate() - 1);
      date.setHours(hours, minutes, 0, 0);
      return date.getTime();
    }
    
    // 处理 "12:34" 格式
    if (timeText.includes(':')) {
      const [hours, minutes] = timeText.split(':').map(Number);
      const date = new Date(today);
      date.setHours(hours, minutes, 0, 0);
      return date.getTime();
    }
    
    // 处理 "2024-01-01 12:34" 格式
    if (timeText.includes('-')) {
      const date = new Date(timeText);
      return isNaN(date.getTime()) ? Date.now() : date.getTime();
    }
    
    return Date.now();
  }

  // 判断消息是否重要
  private isImportantMessage(content: string, type: string): boolean {
    // 定义重要消息的关键词
    const importantKeywords = ['价格', '优惠', '折扣', '库存', '发货', '质量', '规格', '型号', '订单', '支付'];
    
    // 检查内容是否包含重要关键词
    for (const keyword of importantKeywords) {
      if (content.includes(keyword)) {
        return true;
      }
    }
    
    // 图片和文件通常比较重要
    return type === 'image' || type === 'file';
  }

  // 过滤重复消息
  private filterDuplicateMessages(messages: Message[]): Message[] {
    const seen = new Set<string>();
    return messages.filter(msg => {
      const key = `${msg.name}:${msg.content}:${msg.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // 对消息进行优先级排序
  private prioritizeMessages(messages: Message[]): Message[] {
    // 基于重要性和时间排序
    return messages.sort((a, b) => {
      // 重要消息优先
      if (a.isImportant && !b.isImportant) return -1;
      if (!a.isImportant && b.isImportant) return 1;
      // 时间较近的优先
      return b.timestamp - a.timestamp;
    });
  }

  // 分析图片内容
  private async analyzeImageContent(imageUrl: string): Promise<string> {
    // 检查缓存
    if (this.cacheManager.has(imageUrl)) {
      const cachedDescription = this.cacheManager.get(imageUrl);
      console.log(`🔄 使用缓存的图片分析结果`);
      return cachedDescription || '';
    }

    try {
      // 构建图片分析的提示词
      const prompt = `请分析以下图片的内容，详细描述图片中包含的信息，包括商品、文字、颜色、形状等：
图片URL: ${imageUrl}`;
      
      // 调用AI生成回复
      const description = await this.aiReply.generateReply(prompt);
      console.log(`🤖 图片分析结果: ${description}`);
      
      // 缓存结果
      if (description) {
        this.cacheManager.set(imageUrl, description);
      }
      
      return description;
    } catch (error) {
      console.error('❌ 图片内容分析失败:', error);
      return '';
    }
  }

  // 分析文件内容
  private async analyzeFileContent(fileUrl: string): Promise<string> {
    // 检查缓存
    if (this.cacheManager.has(fileUrl)) {
      const cachedDescription = this.cacheManager.get(fileUrl);
      console.log(`🔄 使用缓存的文件分析结果`);
      return cachedDescription || '';
    }

    try {
      // 构建文件分析的提示词
      const prompt = `请分析以下文件的内容，详细描述文件中包含的信息：
文件URL: ${fileUrl}`;
      
      // 调用AI生成回复
      const description = await this.aiReply.generateReply(prompt);
      console.log(`🤖 文件分析结果: ${description}`);
      
      // 缓存结果
      if (description) {
        this.cacheManager.set(fileUrl, description);
      }
      
      return description;
    } catch (error) {
      console.error('❌ 文件内容分析失败:', error);
      return '';
    }
  }
}
