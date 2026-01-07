
import { CategoryId } from './types';

export const CATEGORY_METADATA: Record<CategoryId, { label: string; group: string; color: string }> = {
  [CategoryId.REAL_ESTATE]: { label: '房产', group: 'Asset', color: '#6366f1' },
  [CategoryId.CASH_NO_INTEREST]: { label: '无存款利息账户', group: 'Cash', color: '#10b981' },
  [CategoryId.CASH_INTEREST]: { label: '有存款利息账户', group: 'Cash', color: '#34d399' },
  [CategoryId.CASH_STOCK]: { label: '股票现金账户', group: 'Cash', color: '#6ee7b7' },
  [CategoryId.BONDS]: { label: '债券', group: 'Asset', color: '#f59e0b' },
  [CategoryId.RSU]: { label: 'RSU', group: 'Stock', color: '#ef4444' },
  [CategoryId.STOCKS_INDIVIDUAL]: { label: '其他个股', group: 'Stock', color: '#f87171' },
  [CategoryId.STOCKS_INDEX]: { label: '大盘指数', group: 'Stock', color: '#fb7185' },
  [CategoryId.PENSION]: { label: '养老金账户', group: 'Asset', color: '#8b5cf6' },
  [CategoryId.BITCOIN]: { label: '比特币', group: 'Asset', color: '#f97316' },
};

export const GROUPS = {
  CASH: '现金账户',
  STOCK: '股票',
};

export const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#3b82f6', '#14b8a6'
];
