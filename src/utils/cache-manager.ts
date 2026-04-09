// 缓存管理工具
import * as fs from 'fs';
import * as path from 'path';

export class CacheManager {
  private cache: Map<string, string> = new Map();
  private cacheFile: string;

  constructor(cacheFileName: string = 'analysis-cache.json') {
    this.cacheFile = path.join(process.cwd(), 'data', cacheFileName);
    this.loadCache();
  }

  /**
   * 加载缓存
   */
  loadCache(): void {
    try {
      // 确保 data 目录存在
      const dataDir = path.dirname(this.cacheFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 读取缓存文件
      if (fs.existsSync(this.cacheFile)) {
        const cacheData = fs.readFileSync(this.cacheFile, 'utf8');
        const parsedData = JSON.parse(cacheData);
        
        // 恢复缓存
        for (const [key, value] of Object.entries(parsedData)) {
          this.cache.set(key, value as string);
        }
        console.log(`✅ 加载了 ${this.cache.size} 条缓存`);
      }
    } catch (error) {
      console.error('❌ 加载缓存失败:', error);
    }
  }

  /**
   * 保存缓存
   */
  saveCache(): void {
    try {
      // 确保 data 目录存在
      const dataDir = path.dirname(this.cacheFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 转换为对象并保存
      const cacheData = Object.fromEntries(this.cache);
      fs.writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
      console.log(`✅ 保存了 ${this.cache.size} 条缓存`);
    } catch (error) {
      console.error('❌ 保存缓存失败:', error);
    }
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存值
   */
  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   */
  set(key: string, value: string): void {
    this.cache.set(key, value);
    this.saveCache();
  }

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   * @returns 是否存在
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
}
