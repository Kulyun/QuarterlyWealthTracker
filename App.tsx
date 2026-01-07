
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  TrendingUp, 
  Settings, 
  Wallet, 
  ChevronRight, 
  Trash2, 
  Plus, 
  Info,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

import { CategoryId, WealthRecord, Entry, QuarterData } from './types';
import { CATEGORY_METADATA, COLORS } from './constants';
import { calculateQuarterMetrics, formatCurrency, sumEntries } from './utils/calculations';
import { getFinancialAdvice } from './services/geminiService';

// Initialize Empty Data
const createEmptyQuarterData = (): QuarterData => {
  const data: any = {};
  Object.values(CategoryId).forEach(id => {
    data[id] = [];
  });
  return data as QuarterData;
};

const INITIAL_RECORDS: WealthRecord[] = [
  {
    id: '2024-Q1',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 90,
    data: {
      ...createEmptyQuarterData(),
      [CategoryId.CASH_NO_INTEREST]: [{ id: '1', label: '工资 card', value: 3000 }, { id: '2', label: 'Cash', value: 5000 }],
      [CategoryId.CASH_INTEREST]: [{ id: '3', label: 'Saving', value: 20000 }],
      [CategoryId.REAL_ESTATE]: [{ id: '4', label: 'Apartment', value: 3500000 }],
      [CategoryId.BITCOIN]: [{ id: '5', label: 'Cold Wallet', value: 45000 }],
      [CategoryId.STOCKS_INDEX]: [{ id: '6', label: 'S&P 500', value: 120000 }],
      [CategoryId.PENSION]: [{ id: '7', label: '401k', value: 50000 }]
    }
  }
];

const App: React.FC = () => {
  const [records, setRecords] = useState<WealthRecord[]>(() => {
    const saved = localStorage.getItem('wealth_tracker_records');
    return saved ? JSON.parse(saved) : INITIAL_RECORDS;
  });

  useEffect(() => {
    localStorage.setItem('wealth_tracker_records', JSON.stringify(records));
  }, [records]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
        {/* Mobile Navigation - Optimized for safe area */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-around p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-50">
          <Link to="/" className="p-2 text-slate-500 hover:text-indigo-600 flex flex-col items-center gap-1">
            <LayoutDashboard size={22} />
            <span className="text-[10px] font-medium">概览</span>
          </Link>
          <Link to="/add" className="p-2 text-slate-500 hover:text-indigo-600 flex flex-col items-center gap-1">
            <PlusCircle size={22} />
            <span className="text-[10px] font-medium">记账</span>
          </Link>
          <Link to="/trends" className="p-2 text-slate-500 hover:text-indigo-600 flex flex-col items-center gap-1">
            <TrendingUp size={22} />
            <span className="text-[10px] font-medium">趋势</span>
          </Link>
        </nav>

        {/* Sidebar for desktop */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 sticky top-0 h-screen">
          <div className="p-6 flex items-center gap-3 border-b border-slate-100">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Wallet className="text-white" size={24} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">WealthTrack</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <NavItem to="/" icon={<LayoutDashboard size={20} />} label="仪表盘" />
            <NavItem to="/add" icon={<PlusCircle size={20} />} label="记录资产" />
            <NavItem to="/trends" icon={<TrendingUp size={20} />} label="趋势分析" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-32 md:pb-0">
          <Routes>
            <Route path="/" element={<Dashboard records={records} />} />
            <Route path="/add" element={<AddRecord records={records} setRecords={setRecords} />} />
            <Route path="/trends" element={<Trends records={records} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const NavItem: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
};

/* --- Dashboard Component --- */
const Dashboard: React.FC<{ records: WealthRecord[] }> = ({ records }) => {
  const latestRecord = records[records.length - 1];
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const { metrics, totalAssetsChartData, disposableAssetsChartData } = useMemo(() => {
    if (!latestRecord) return { groups: [], metrics: { totalAssets: 0, disposableAssets: 0, totalMarketIndex: 0 }, totalAssetsChartData: [], disposableAssetsChartData: [] };
    return calculateQuarterMetrics(latestRecord);
  }, [latestRecord]);

  const handleGetAdvice = async () => {
    if (!latestRecord) return;
    setLoadingAdvice(true);
    const result = await getFinancialAdvice(latestRecord, metrics);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  const renderLabel = ({ name, percent }: any) => {
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  if (!latestRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="bg-slate-100 p-6 rounded-full mb-6">
          <PlusCircle size={48} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">欢迎使用 WealthTrack</h2>
        <p className="text-slate-500 max-w-md mb-8">您还没有任何资产记录。开始记录您的第一个季度资产。</p>
        <Link to="/add" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
          添加首个记录
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">{latestRecord.id} 报告</span>
          <h1 className="text-3xl font-bold mt-1">财务总览</h1>
        </div>
        <button 
          onClick={handleGetAdvice}
          disabled={loadingAdvice}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-3 rounded-2xl font-medium shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {loadingAdvice ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Sparkles size={18} />}
          AI 理财建议
        </button>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MetricCard label="总资产" value={metrics.totalAssets} icon={<Wallet className="text-indigo-600" />} color="indigo" />
        <MetricCard label="可支配资产" value={metrics.disposableAssets} icon={<TrendingUp className="text-emerald-600" />} color="emerald" description="不包含房产" />
        <MetricCard label="指数投资" value={metrics.totalMarketIndex} icon={<ArrowUpRight className="text-amber-600" />} color="amber" description="养老金 + 大盘指数" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Chart 1: Total Assets Distribution */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">总资产分布</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={totalAssetsChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={renderLabel}
                >
                  {totalAssetsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Disposable Assets Distribution */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">可支配资产分布</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={disposableAssetsChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={renderLabel}
                >
                  {disposableAssetsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {advice && (
          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-2 mb-3 text-indigo-700">
              <Sparkles size={18} />
              <h3 className="font-bold">理财建议</h3>
            </div>
            <div className="prose prose-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">
              {advice}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string, value: number, icon: React.ReactNode, color: string, description?: string }> = ({ label, value, icon, color, description }) => {
  const bgColors: any = { indigo: 'bg-indigo-50', emerald: 'bg-emerald-50', amber: 'bg-amber-50' };
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-xs font-medium mb-1">{label}</p>
          <h4 className="text-xl font-bold tracking-tight">{formatCurrency(value)}</h4>
          {description && <p className="text-[10px] text-slate-400 mt-0.5">{description}</p>}
        </div>
        <div className={`${bgColors[color]} p-2.5 rounded-2xl`}>{icon}</div>
      </div>
    </div>
  );
};

/* --- AddRecord Component --- */
const AddRecord: React.FC<{ records: WealthRecord[], setRecords: React.Dispatch<React.SetStateAction<WealthRecord[]>> }> = ({ records, setRecords }) => {
  const [quarterId, setQuarterId] = useState(() => {
    const d = new Date();
    const q = Math.floor(d.getMonth() / 3) + 1;
    return `${d.getFullYear()}-Q${q}`;
  });
  const [data, setData] = useState<QuarterData>(createEmptyQuarterData());
  const [activeTab, setActiveTab] = useState<CategoryId>(CategoryId.CASH_NO_INTEREST);

  const handleAddEntry = (catId: CategoryId) => {
    setData(prev => ({
      ...prev,
      [catId]: [...prev[catId], { id: Date.now().toString(), label: '', value: 0 }]
    }));
  };

  const updateEntry = (catId: CategoryId, entryId: string, field: 'label' | 'value', value: any) => {
    setData(prev => ({
      ...prev,
      [catId]: prev[catId].map(e => e.id === entryId ? { ...e, [field]: value } : e)
    }));
  };

  const deleteEntry = (catId: CategoryId, entryId: string) => {
    setData(prev => ({
      ...prev,
      [catId]: prev[catId].filter(e => e.id !== entryId)
    }));
  };

  const handleSave = () => {
    const newRecord: WealthRecord = {
      id: quarterId,
      timestamp: Date.now(),
      data
    };
    setRecords(prev => {
      const filtered = prev.filter(r => r.id !== quarterId);
      return [...filtered, newRecord].sort((a, b) => a.timestamp - b.timestamp);
    });
    alert('记录已保存！');
  };

  const groupTotals = useMemo(() => {
    const catTotals: Record<string, number> = {};
    Object.values(CategoryId).forEach(id => {
      catTotals[id] = sumEntries(data[id]);
    });
    return catTotals;
  }, [data]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-40">
      <header className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">季度资产登记</h1>
          <p className="text-sm text-slate-500">记录本季度各项资产分项</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="text" 
            value={quarterId} 
            onChange={e => setQuarterId(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center font-bold"
          />
          <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-transform">
            保存
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Category Selector - Horizontal Scroll on Mobile */}
        <div className="md:col-span-1 flex md:flex-col overflow-x-auto gap-2 pb-2 md:pb-0 scrollbar-hide">
          {Object.entries(CATEGORY_METADATA).map(([id, meta]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as CategoryId)}
              className={`flex-shrink-0 md:w-full text-left px-4 py-3 rounded-2xl flex flex-col transition-all border ${activeTab === id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-500 border-slate-100'}`}
            >
              <span className={`text-[10px] font-bold uppercase ${activeTab === id ? 'text-indigo-200' : 'text-slate-400'}`}>{meta.group}</span>
              <span className="font-semibold whitespace-nowrap">{meta.label}</span>
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="md:col-span-3 bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">{CATEGORY_METADATA[activeTab].label}</h3>
            <span className="text-xl font-black text-indigo-600">{formatCurrency(groupTotals[activeTab])}</span>
          </div>

          <div className="space-y-4">
            {data[activeTab].map((entry) => (
              <div key={entry.id} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={entry.label}
                  onChange={e => updateEntry(activeTab, entry.id, 'label', e.target.value)}
                  placeholder="项目名称"
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-indigo-100 focus:outline-none bg-slate-50 text-sm"
                />
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">¥</span>
                  <input
                    type="number"
                    value={entry.value === 0 ? '' : entry.value}
                    onChange={e => updateEntry(activeTab, entry.id, 'value', Number(e.target.value))}
                    placeholder="金额"
                    className="w-full px-4 py-3 pl-7 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-indigo-100 focus:outline-none bg-slate-50 font-bold text-sm"
                  />
                </div>
                <button onClick={() => deleteEntry(activeTab, entry.id)} className="p-2 text-slate-300 active:text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            <button 
              onClick={() => handleAddEntry(activeTab)}
              className="w-full border-2 border-dashed border-slate-100 py-4 rounded-2xl text-slate-400 font-semibold flex items-center justify-center gap-2 active:bg-slate-50"
            >
              <Plus size={18} />
              添加分项
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- Trends Component --- */
const Trends: React.FC<{ records: WealthRecord[] }> = ({ records }) => {
  const trendData = useMemo(() => {
    return records.map(r => {
      const { metrics } = calculateQuarterMetrics(r);
      return {
        name: r.id,
        '总资产': metrics.totalAssets,
        '可支配': metrics.disposableAssets,
        '指数': metrics.totalMarketIndex
      };
    });
  }, [records]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">趋势分析</h1>
        <p className="text-slate-500">资产季度增长变化</p>
      </header>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6">
        <h3 className="text-lg font-bold mb-6">资产增长曲线</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${(val / 10000).toFixed(0)}w`} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="总资产" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="可支配" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold px-1">历史季度</h4>
        {[...records].reverse().map(r => {
          const { metrics } = calculateQuarterMetrics(r);
          return (
            <div key={r.id} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                  {r.id.split('-')[1]}
                </div>
                <div>
                  <span className="font-bold block">{r.id}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-tight">资产更新记录</span>
                </div>
              </div>
              <div className="text-right">
                <span className="block font-bold text-sm">{formatCurrency(metrics.totalAssets)}</span>
                <span className="text-[10px] text-emerald-500 font-medium">季度记录</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
