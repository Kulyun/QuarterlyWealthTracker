
import { CategoryId, QuarterData, WealthRecord, CalculatedGroup, GlobalMetrics } from '../types';
import { CATEGORY_METADATA } from '../constants';

export const sumEntries = (entries: { value: number }[]) => {
  return entries.reduce((acc, curr) => acc + curr.value, 0);
};

export const calculateQuarterMetrics = (record: WealthRecord): { 
  groups: CalculatedGroup[]; 
  metrics: GlobalMetrics;
  totalAssetsChartData: { name: string; value: number; color: string }[];
  disposableAssetsChartData: { name: string; value: number; color: string }[];
} => {
  const data = record.data;
  
  const getSum = (id: CategoryId) => sumEntries(data[id] || []);

  const cashTotal = getSum(CategoryId.CASH_NO_INTEREST) + 
                    getSum(CategoryId.CASH_INTEREST) + 
                    getSum(CategoryId.CASH_STOCK);

  const stockTotal = getSum(CategoryId.RSU) + 
                     getSum(CategoryId.STOCKS_INDIVIDUAL) + 
                     getSum(CategoryId.STOCKS_INDEX);

  const realEstateTotal = getSum(CategoryId.REAL_ESTATE);
  const bondsTotal = getSum(CategoryId.BONDS);
  const pensionTotal = getSum(CategoryId.PENSION);
  const bitcoinTotal = getSum(CategoryId.BITCOIN);
  const rsuTotal = getSum(CategoryId.RSU);
  const indexFundsTotal = getSum(CategoryId.STOCKS_INDEX);
  const individualStocksTotal = getSum(CategoryId.STOCKS_INDIVIDUAL);

  const totalAssets = realEstateTotal + cashTotal + bondsTotal + stockTotal + pensionTotal + bitcoinTotal;
  const disposableAssets = cashTotal + rsuTotal + (pensionTotal + indexFundsTotal) + bondsTotal + individualStocksTotal + bitcoinTotal;
  const totalMarketIndex = pensionTotal + indexFundsTotal;

  // Chart 1: Total Assets Distribution
  // 总资产 = 房产 + 现金账户 + 债券 + 股票 + 比特币 + 养老金账户
  const totalAssetsChartData = [
    { name: '房产', value: realEstateTotal, color: CATEGORY_METADATA[CategoryId.REAL_ESTATE].color },
    { name: '现金账户', value: cashTotal, color: CATEGORY_METADATA[CategoryId.CASH_NO_INTEREST].color },
    { name: '债券', value: bondsTotal, color: CATEGORY_METADATA[CategoryId.BONDS].color },
    { name: '股票', value: stockTotal, color: CATEGORY_METADATA[CategoryId.RSU].color },
    { name: '比特币', value: bitcoinTotal, color: CATEGORY_METADATA[CategoryId.BITCOIN].color },
    { name: '养老金账户', value: pensionTotal, color: CATEGORY_METADATA[CategoryId.PENSION].color },
  ].filter(d => d.value > 0);

  // Chart 2: Disposable Assets Distribution
  // 可支配资产 = 现金 + RSU + 总大盘指数（养老金+大盘指数）+ 债券 + 其他个股 + 比特币
  const disposableAssetsChartData = [
    { name: '现金', value: cashTotal, color: CATEGORY_METADATA[CategoryId.CASH_NO_INTEREST].color },
    { name: 'RSU', value: rsuTotal, color: CATEGORY_METADATA[CategoryId.RSU].color },
    { name: '总大盘指数', value: totalMarketIndex, color: CATEGORY_METADATA[CategoryId.STOCKS_INDEX].color },
    { name: '债券', value: bondsTotal, color: CATEGORY_METADATA[CategoryId.BONDS].color },
    { name: '其他个股', value: individualStocksTotal, color: CATEGORY_METADATA[CategoryId.STOCKS_INDIVIDUAL].color },
    { name: '比特币', value: bitcoinTotal, color: CATEGORY_METADATA[CategoryId.BITCOIN].color },
  ].filter(d => d.value > 0);

  const groups: CalculatedGroup[] = [
    {
      id: 'CASH',
      label: '现金账户',
      total: cashTotal,
      percentageOfTotal: (cashTotal / totalAssets) * 100 || 0,
      children: [
        { id: CategoryId.CASH_NO_INTEREST, label: '无利息', total: getSum(CategoryId.CASH_NO_INTEREST), percentageOfGroup: (getSum(CategoryId.CASH_NO_INTEREST) / cashTotal) * 100 || 0 },
        { id: CategoryId.CASH_INTEREST, label: '有利息', total: getSum(CategoryId.CASH_INTEREST), percentageOfGroup: (getSum(CategoryId.CASH_INTEREST) / cashTotal) * 100 || 0 },
        { id: CategoryId.CASH_STOCK, label: '股票现金', total: getSum(CategoryId.CASH_STOCK), percentageOfGroup: (getSum(CategoryId.CASH_STOCK) / cashTotal) * 100 || 0 },
      ]
    },
    {
      id: 'STOCK',
      label: '股票',
      total: stockTotal,
      percentageOfTotal: (stockTotal / totalAssets) * 100 || 0,
      children: [
        { id: CategoryId.RSU, label: 'RSU', total: getSum(CategoryId.RSU), percentageOfGroup: (getSum(CategoryId.RSU) / stockTotal) * 100 || 0 },
        { id: CategoryId.STOCKS_INDIVIDUAL, label: '个股', total: getSum(CategoryId.STOCKS_INDIVIDUAL), percentageOfGroup: (getSum(CategoryId.STOCKS_INDIVIDUAL) / stockTotal) * 100 || 0 },
        { id: CategoryId.STOCKS_INDEX, label: '大盘指数', total: getSum(CategoryId.STOCKS_INDEX), percentageOfGroup: (getSum(CategoryId.STOCKS_INDEX) / stockTotal) * 100 || 0 },
      ]
    }
  ];

  return {
    groups,
    metrics: {
      disposableAssets,
      totalAssets,
      totalMarketIndex
    },
    totalAssetsChartData,
    disposableAssetsChartData
  };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(value);
};
