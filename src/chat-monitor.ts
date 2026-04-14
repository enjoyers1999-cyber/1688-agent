import { Page } from 'playwright';
import { config } from './config.js';
import { SessionManager } from './session-manager.js';
import { findChatFrame, findSessions, filterSessionsByCustomerName, isLoginRequired, sleep } from './chat-utils.js';

// 聊天监控器
export class ChatMonitor {
  private page: Page;
  private sessionManager: SessionManager;
  private intervalMs: number;
  private errorCount: number = 0;
  private isRunning: boolean = false;
  private chatFrame: any = null;

  constructor(page: Page) {
    this.page = page;
    this.sessionManager = new SessionManager();
    this.intervalMs = config.monitor.intervalMs;
  }

  async start(): Promise<void> {
    this.isRunning = true;
    console.log('🔔 开始监控 1688 聊天消息...');
    this.monitorLoop();
  }

  stop(): void {
    this.isRunning = false;
    console.log('⏸️ 停止监控');
  }

  private async monitorLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.checkNewMessages();
        this.errorCount = 0;
      } catch (error) {
        this.errorCount++;
        console.error(`⚠️ 监控错误 (${this.errorCount}/${config.monitor.maxErrors}):`, error);

        if (this.errorCount >= config.monitor.maxErrors) {
          console.log('🔄 错误次数过多，准备重启浏览器...');
          throw new Error('MAX_ERRORS_EXCEEDED');
        }
      }

      await sleep(this.intervalMs);
    }
  }

  private async checkNewMessages(): Promise<void> {
    console.log('🔍 开始检查新消息...');
    console.log('当前页面:', this.page.url());
    
    // 等待页面加载完成（使用load状态，比networkidle更宽松）
    try {
      await this.page.waitForLoadState('load', { timeout: 60000 }); // 增加超时时间到60秒
    } catch (error) {
      console.warn('⚠️ 页面加载超时，继续执行', error);
      // 即使超时也继续执行，因为页面可能已经加载了足够的内容
    }
    
    // 检查是否需要登录
    if (isLoginRequired(this.page.url())) {
      console.log('🔐 需要登录');
      return;
    }
    
    // 检查并获取聊天 iframe
    this.chatFrame = await findChatFrame(this.page);
    this.sessionManager.setChatFrame(this.chatFrame);
    
    // 保存页面截图用于调试
    // await this.page.screenshot({ path: 'debug-page.png' });
    // console.log('📷 已保存页面截图到 debug-page.png');
    
    // 查找会话
    // 在聊天iframe中查找会话，如果找到的话
    const searchPage = this.chatFrame || this.page;
    console.log('在', this.chatFrame ? 'iframe' : '主页面', '中查找会话');
    
    const sessions = await findSessions(searchPage);

    // 筛选指定客户名称的会话
    const targetCustomersFile = config.monitor.targetCustomersFile; // 从配置中获取目标客户配置文件路径
    const filteredSessions = await filterSessionsByCustomerName(sessions, targetCustomersFile);
    
    // 从原始sessions中剔除filteredSessions
    const remainingSessions = sessions.filter(session => {
      // 检查session是否在filteredSessions中
      return !filteredSessions.some(filtered => filtered.session === session);
    });
    console.log(`📊 原始会话数: ${sessions.length}, 筛选后会话数: ${filteredSessions.length}, 剩余会话数: ${remainingSessions.length}`);
    
    if (filteredSessions.length === 0) {
      console.log('⚠️ 未找到匹配的客户会话');
      return;
    }
    
    for (const { session, customer } of filteredSessions) {
      try {
        await this.sessionManager.processSession(session, customer);
      } catch (e) {
        console.log('处理会话时出错:', e);
      }
    }

    // 切换到非目标客户会话窗口
    if (remainingSessions.length > 0) {
      try {
        // 随机选择一个非目标客户会话
        const randomIndex = Math.floor(Math.random() * remainingSessions.length);
        const selectedSession = remainingSessions[randomIndex];
        
        console.log(`🔄 切换到非目标客户会话`);
        await selectedSession.click();
        await sleep(1000); // 等待窗口切换完成
        console.log(`✅ 已切换到非目标客户会话`);
      } catch (error) {
        console.warn('⚠️ 切换到非目标客户会话失败:', error);
      }
    } else {
      console.log('📭 没有非目标客户会话需要切换');
    }
    
    if (filteredSessions.length === 0) {
      console.log('⚠️ 未找到任何会话，开始调试页面结构...');
      // 检查是否需要登录
      if (isLoginRequired(this.page.url())) {
        console.log('🔐 页面需要登录');
      }

      return;
    }
    
  }
}

