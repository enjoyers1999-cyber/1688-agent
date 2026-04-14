// 会话管理器

import { config } from './config.js';
import { AIReply } from './ai-reply.js';
import { SimpleReply } from './simple-reply.js';
import { DefaultReply } from './default-reply.js';
import { MessageProcessor } from './message-processor.js';

export interface ReplyGenerator {
  generateReply(customerMessage: string): Promise<string>;
}

export interface ChatSession {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: number;
  replied: boolean;
}

export class SessionManager {
  private sessions: Map<string, ChatSession> = new Map();
  private replyGenerator: ReplyGenerator;
  private defaultReply: DefaultReply;
  private messageProcessor: MessageProcessor;
  private chatFrame: any = null;

  constructor() {
    // 根据配置创建相应的回复处理器
    if (config.reply.mode === 'simple') {
      this.replyGenerator = new SimpleReply();
    } else {
      this.replyGenerator = new AIReply();
    }
    this.defaultReply = new DefaultReply();
    this.messageProcessor = new MessageProcessor();
  }

  // 设置聊天框架
  setChatFrame(frame: any): void {
    this.chatFrame = frame;
  }

  // 处理会话
  async processSession(session: any, customer?: { name: string; language?: string }): Promise<void> {
    // 获取会话 ID
    const sessionId = await session.evaluate((el: Element) => el.getAttribute('data-id') || el.getAttribute('data-session-id') || Math.random().toString());
    
    // 获取客户名称
    const customerName = customer?.name || '客户';
    const customerLanguage = customer?.language || '中文';

    // 获取最新消息
    const msgEl = await session.$('.conversation-secondary-line .desc, [class*="last-msg"], [class*="message"]:last-child, [class*="preview"]');
    const lastMessage = msgEl ? await msgEl.textContent() : '';
    console.log(customerName);
    // 检查是否有未读标记
    const unreadEl = await session.$('[class*="unread"], [class*="badge"], [class*="dot"]');
    // temp const hasUnread = unreadEl !== null;
    
    const hasUnread = true ;
    if (!lastMessage || !hasUnread) return;

    // 检查是否已回复
    const sessionData = this.sessions.get(sessionId);
    if (sessionData && sessionData.lastMessage === lastMessage) {
      return; // 消息未变，跳过
    }

    // 记录消息接收时间
    const receiveTime = new Date().toLocaleString();
    console.log(`📨 新消息 from ${customerName} (语言: ${customerLanguage}) [${receiveTime}]: ${lastMessage}`);

    // 生成并发送回复
    await this.sendReply(session, customerName+':'+lastMessage, customerLanguage, customerName);

    // 更新会话状态 
    this.sessions.set(sessionId, {
      id: sessionId,
      name: customerName,
      lastMessage,
      lastMessageTime: Date.now(),
      replied: true,
    });
  }

  // 发送回复
  private async sendReply(session: any, customerMessage: string, customerLanguage: string = 'zh', customerName: string = '客户'): Promise<void> {
    // 生成回复
  try {
    // 检查元素是否仍然存在
    try {
      // 尝试获取元素的可见性状态
      const isVisible = await session.isVisible().catch(() => false);
      if (!isVisible) {
        console.warn('⚠️ 会话元素不可见或已从DOM中移除');
        return;
      }
    } catch (visibilityError) {
      console.warn('⚠️ 无法检查会话元素状态:', visibilityError);
      return;
    }
    
    try {
      // await session.click();
    } catch (clickError) {
      console.warn('⚠️ 点击会话元素失败:', clickError);
      return;
    }
    
    let reply: string;
    
    if (config.reply.mode === 'simple') {
      // 简单模式：根据客户语种使用不同的固定回复
      reply = this.defaultReply.getDefaultReply(customerLanguage);
    } else {
      // 智能模式：加载历史对话并通过AI生成回复
      try {
        const historyMessage = await this.messageProcessor.loadHistoryMessages(this.chatFrame);
        // console.log('📜 历史对话:', historyMessage);
        reply = await this.replyGenerator.generateReply(historyMessage + '\n' + customerMessage);
      } catch (historyError) {
        console.warn('⚠️ 加载历史对话失败，使用默认回复:', historyError);
        reply = this.defaultReply.getDefaultReply(customerLanguage);
      }
    }
    
    console.log(`🤖 生成回复 to ${customerName}: ${reply}`);
    await this.sleep(1000);

    // 尝试多种输入方法
    try {
      let inputEl = await this.chatFrame.$('textarea, [contenteditable="true"]');
      
      if (inputEl) {
       /**   
        // 方法1: 尝试 fill
        try {
          await inputEl.fill(reply);
          console.log('✅ 使用 fill 方法设置内容');
        } catch (e) {
          // 方法2: 尝试 type
          try {
            await inputEl.type(reply);
            console.log('✅ 使用 type 方法设置内容');
          } catch (e2) {
            // 方法3: 使用 JavaScript
            await inputEl.evaluate((el: any, value: string) => {
              el.value = value;
              el.dispatchEvent(new Event('input', { bubbles: true }));
            }, reply);
            console.log('✅ 使用 JavaScript 设置内容');
          }
        }
        **/

        /**
        // 发送消息
        const sendBtn = await this.chatFrame.$('[class*="send-btn"]');
        if (sendBtn) {
          await sendBtn.click();
        } else {
          await inputEl.press('Enter');
        }
        console.log('✅ 回复已发送');
        **/

      } else {
        console.log('⚠️ 未找到输入框');
      }
    } catch (inputError) {
      console.warn('⚠️ 处理输入框失败:', inputError);
    }
  } catch (error) {
    console.error('❌ 发送回复失败:', error);
  }
  }

  // 检查当前打开的聊天窗口中的新消息
  async checkOpenChat(page: any): Promise<void> {
    // 检查当前打开的聊天窗口中的新消息
    // 1688 的聊天窗口通常在右侧或弹出

    const chatFrame = await page.$('[class*="chat-window"], [class*="message-panel"], iframe');
    
    if (chatFrame) {
      try {
        const messages = await page.$$('[class*="message-content"], [class*="chat-msg"]');
        
        for (const msg of messages) {
          const isFromCustomer = await msg.evaluate((el: Element) => 
            el.classList.contains('customer') || 
            el.classList.contains('buyer') ||
            el.getAttribute('data-sender') === 'customer'
          );
          
          if (isFromCustomer) {
            const content = await msg.textContent();
            if (content) {
              console.log(`💬 客户消息: ${content}`);
              // 这里可以添加回复逻辑
            }
          }
        }
      } catch (e) {
        // 忽略
      }
    }
  }

  // 睡眠函数
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
