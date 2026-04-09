import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { config } from './config.js';
import * as fs from 'fs';
import * as path from 'path';

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async launch(): Promise<void> {
    console.log('🚀 启动浏览器...');
    
    // 尝试使用系统 Chrome
    const chromePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ];

    let executablePath: string | undefined;
    for (const path of chromePaths) {
      if (fs.existsSync(path)) {
        executablePath = path;
        break;
      }
    }

    this.browser = await chromium.launch({
      headless: false, // 需要可见浏览器以便操作1688
      executablePath, // 使用系统 Chrome
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
      ],
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    // 尝试加载保存的 cookies
    await this.loadCookies();

    this.page = await this.context.newPage();
    console.log('✅ 浏览器启动成功');
  }

  async loadCookies(): Promise<void> {
    const cookiesFile = config['1688'].cookiesFile;
    if (cookiesFile && fs.existsSync(cookiesFile)) {
      try {
        const cookies = JSON.parse(fs.readFileSync(cookiesFile, 'utf-8'));
        await this.context!.addCookies(cookies);
        console.log('📁 已加载保存的登录态');
      } catch (e) {
        console.log('⚠️ 加载 cookies 失败，将进行 fresh 登录');
      }
    }
  }

  async saveCookies(): Promise<void> {
    if (!this.context) return;
    
    const cookiesFile = config['1688'].cookiesFile;
    if (cookiesFile) {
      const cookies = await this.context.cookies();
      const dir = path.dirname(cookiesFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(cookiesFile, JSON.stringify(cookies, null, 2));
      console.log('💾 登录态已保存');
    }
  }

  async goToChat(): Promise<Page> {
    if (!this.page) throw new Error('浏览器未启动');
    
    console.log('🔗 前往 1688 消息中心...');
    // loginUrl chatUrl 
    // 经常直接跳转到消息中心，可能会反爬系统的怀疑，建议只是打开登录页面
    await this.page.goto(config['1688'].chatUrl, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // 等待聊天列表加载
    await this.page.waitForTimeout(3000);
    
    return this.page;
  }

  async checkLogin(): Promise<boolean> {
    if (!this.page) return false;
    
    // 检查是否跳转到登录页
    const url = this.page.url();
    if (url.includes('login.1688.com')) {
      console.log('⚠️ 未登录，需要扫码登录');
      return false;
    }
    
    return true;
  }

  async waitForLogin(): Promise<void> {
    if (!this.page) return;
    
    console.log('⏳ 等待登录...');
    
    // 等待跳转到消息中心
    await this.page.waitForFunction(
      () => !window.location.href.includes('login.1688.com'),
      { timeout: 120000 }
    );
    
    console.log('✅ 登录成功');
    await this.saveCookies();
  }

  getPage(): Page | null {
    return this.page;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('👋 浏览器已关闭');
    }
  }

  async restart(): Promise<void> {
    await this.close();
    await this.launch();
  }
}
