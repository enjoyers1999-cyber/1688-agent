// 聊天工具函数

// 检查并获取聊天 iframe
export async function findChatFrame(page: any): Promise<any> {
  try {
    // 检查iframe
    const iframes = await page.$$('iframe');
    console.log('找到', iframes.length, '个iframe');
    
    for (let i = 0; i < iframes.length; i++) {
      try {
        const frame = await iframes[i].contentFrame();
        if (frame) {
          console.log('iframe', i, 'URL:', await frame.url());
          const frameContent = await frame.content();
          if (frameContent.includes('conversation-item')) {
            console.log('找到聊天iframe');
            return frame;
          }
        }
      } catch (e) {
        console.log('检查iframe时出错:', e);
      }
    }
    return null;
  } catch (error) {
    console.error('查找聊天iframe失败:', error);
    return null;
  }
}

// 查找会话元素
export async function findSessions(searchPage: any): Promise<any[]> {
  try {
    // 尝试不同的选择器来查找聊天列表
    const sessionSelectors = [
      '[class*="conversation-item"]'
    ];
    
    let sessions: any[] = [];
    
    // 尝试每个选择器
    for (const selector of sessionSelectors) {
      const elements = await searchPage.$$(selector);
      console.log(`选择器 "${selector}" 找到 ${elements.length} 个元素`);
      sessions = sessions.concat(elements);
    }
    
    // 去重
    sessions = [...new Set(sessions)];
    console.log(`总共找到 ${sessions.length} 个会话`);
    
    return sessions;
  } catch (error) {
    console.error('查找会话失败:', error);
    return [];
  }
}

// 检查页面是否需要登录
export function isLoginRequired(url: string): boolean {
  return url.includes('login.1688.com');
}

// 睡眠函数
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
