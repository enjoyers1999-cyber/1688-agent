// 聊天工具函数
import fs from 'fs';
import path from 'path';

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

// 读取目标客户配置文件
export function readTargetCustomersConfig(configPath: string): { name: string; enabled: boolean; language?: string }[] {
  try {
    const fullPath = path.resolve(configPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const config = JSON.parse(content);
      return config.targetCustomers || [];
    } else {
      console.log(`⚠️ 目标客户配置文件不存在: ${fullPath}`);
      return [];
    }
  } catch (error) {
    console.error('读取目标客户配置文件失败:', error);
    return [];
  }
}

// 筛选指定客户名称的会话
export async function filterSessionsByCustomerName(sessions: any[], targetCustomersFile: string): Promise<{ session: any; customer: { name: string; language?: string } }[]> {
  const targetCustomers = readTargetCustomersConfig(targetCustomersFile);
  
  if (targetCustomers.length === 0) {
    console.log('ℹ️ 未配置目标客户，处理所有会话');
    return sessions.map(session => ({ session, customer: { name: '未知客户' } }));
  }
  
  const enabledCustomers = targetCustomers.filter(customer => customer.enabled);
  if (enabledCustomers.length === 0) {
    console.log('ℹ️ 没有启用的目标客户，处理所有会话');
    return sessions.map(session => ({ session, customer: { name: '未知客户' } }));
  }
  
  console.log(`🔍 筛选客户名称为 ${enabledCustomers.map(c => `"${c.name}"`).join(', ')} 的会话`);
  const filteredSessions: { session: any; customer: { name: string; language?: string } }[] = [];
  
  for (const session of sessions) {
    try {
      const nickElement = await session.$('[class*="name"]');
      if (nickElement) {
        const customerName = await nickElement.textContent();
        if (customerName) {
          const matchedCustomer = enabledCustomers.find(customer => customerName.includes(customer.name));
          if (matchedCustomer) {
            filteredSessions.push({ 
              session, 
              customer: { 
                name: customerName, 
                language: matchedCustomer.language 
              } 
            });
            console.log(`✅ 找到匹配的客户会话: ${customerName} (语言: ${matchedCustomer.language || '未知'})`);
          }
        }
      }
    } catch (e) {
      console.log('筛选会话时出错:', e);
    }
  }
  
  console.log(`筛选后剩余 ${filteredSessions.length} 个会话`);
  
  return filteredSessions;
}
