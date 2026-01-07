
export enum CategoryId {
  REAL_ESTATE = 'REAL_ESTATE',
  CASH_NO_INTEREST = 'CASH_NO_INTEREST',
  CASH_INTEREST = 'CASH_INTEREST',
  CASH_STOCK = 'CASH_STOCK',
  BONDS = 'BONDS',
  RSU = 'RSU',
  STOCKS_INDIVIDUAL = 'STOCKS_INDIVIDUAL',
  STOCKS_INDEX = 'STOCKS_INDEX',
  PENSION = 'PENSION',
  BITCOIN = 'BITCOIN'
}

export interface Entry {
  id: string;
  value: number;
  label: string;
}

export type QuarterData = {
  [key in CategoryId]: Entry[];
};

export interface WealthRecord {
  id: string; // e.g., "2024-Q1"
  timestamp: number;
  data: QuarterData;
}

export interface CalculatedGroup {
  id: string;
  label: string;
  total: number;
  percentageOfTotal: number;
  children: {
    id: CategoryId;
    label: string;
    total: number;
    percentageOfGroup: number;
  }[];
}

export interface GlobalMetrics {
  disposableAssets: number;
  totalAssets: number;
  totalMarketIndex: number;
}
