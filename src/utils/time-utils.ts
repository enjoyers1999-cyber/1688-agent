// 时间工具函数

/**
 * 解析消息时间
 * @param timeText 时间文本
 * @returns 时间戳
 */
export function parseMessageTime(timeText: string): number {
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
