import dotenv from 'dotenv';
dotenv.config();

import { config } from './config.js';
import { BrowserManager } from './browser.js';
import { ChatMonitor } from './chat-monitor.js';

class Agent1688 {
  private browser: BrowserManager;
  private monitor: ChatMonitor | null = null;
  private needsLogin: boolean = false;

  constructor() {
    this.browser = new BrowserManager();
  }

  async start(): Promise<void> {
    console.log('='.repeat(50));
    console.log('🤖 1688 自动回复 Agent 启动中...');
    console.log('='.repeat(50));

    try {
      // 1. 启动浏览器
      await this.browser.launch();

      // 2. 前往聊天页面
      const page = await this.browser.goToChat();

      // 3. 检查登录状态
      const isLoggedIn = await this.browser.checkLogin();
      
      if (!isLoggedIn) {
        this.needsLogin = true;
        console.log('');
        console.log('┌─────────────────────────────────────────┐');
        console.log('│  ⚠️  需要登录 1688 账号                  │');
        console.log('│                                         │');
        console.log('│  请在打开的浏览器窗口中扫码或账号登录    │');
        console.log('│  登录成功后 Agent 将自动开始监控        │');
        console.log('└─────────────────────────────────────────┘');
        console.log('');

        // 等待登录完成
        await this.browser.waitForLogin();
      }

      // 4. 初始化监控器
      this.monitor = new ChatMonitor(page);
      
      // 5. 开始监控
      await this.monitor.start();

    } catch (error: any) {
      if (error.message === 'MAX_ERRORS_EXCEEDED') {
        console.log('🔄 即将重启浏览器...');
        await this.sleep(3000);
        await this.start(); // 递归重启
      } else {
        console.error('❌ Agent 错误:', error);
        await this.cleanup();
      }
    }
  }

  async stop(): Promise<void> {
    console.log('🛑 正在停止 Agent...');
    
    if (this.monitor) {
      this.monitor.stop();
    }
    
    await this.browser.close();
    console.log('👋 Agent 已停止');
  }

  private async cleanup(): Promise<void> {
    if (this.monitor) {
      this.monitor.stop();
    }
    await this.browser.close();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 主函数
async function main() {
  const agent = new Agent1688();

  // 优雅关闭
  const shutdown = async () => {
    console.log('\n🛑 收到关闭信号...');
    await agent.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // 启动
  await agent.start();
}

// 运行
main().catch(console.error);
