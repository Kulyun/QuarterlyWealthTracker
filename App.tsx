
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ArrowUpRight,
  Download,
  Upload,
  AlertTriangle,
  History,
  RefreshCw,
  Cpu,
  FileText,
  ChevronDown,
  Calendar,
  X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

import { CategoryId, WealthRecord, Entry, QuarterData } from './types';
import { CATEGORY_METADATA, COLORS } from './constants';
import { calculateQuarterMetrics, formatCurrency, sumEntries } from './utils/calculations';
import { getFinancialAdvice } from './services/geminiService';

// App Version/Build Info
const APP_VERSION = "1.2.2";
const BUILD_DATE = new Date().toLocaleDateString();

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
        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-around p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-50">
          <Link to="/" className="p-2 text-slate-500 hover:text-indigo-600 flex flex-col items-center gap-1">
            <LayoutDashboard size={22} />
            <span className="text-[10px] font-medium">概览</span>
          </Link>
          <Link to="/add" className="p-2 text-slate-500 hover:text-indigo-600 flex flex-col items-center gap-1">
            <PlusCircle size={22} />
            <span className="text-[10px] font-medium">记账</span>
          </Link>
          <Link to="/manage" className="p-2 text-slate-500 hover:text-indigo-600 flex flex-col items-center gap-1">
            <FileText size={22} />
            <span className="text-[10px] font-medium">详情</span>
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
            <NavItem to="/manage" icon={<FileText size={20} />} label="记录详情" />
            <NavItem to="/trends" icon={<TrendingUp size={20} />} label="趋势分析" />
          </nav>
          <div className="p-4 border-t border-slate-100">
             <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Version {APP_VERSION}</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-32 md:pb-0">
          <Routes>
            <Route path="/" element={<Dashboard records={records} />} />
            <Route path="/add" element={<AddRecord records={records} setRecords={setRecords} />} />
            <Route path="/manage" element={<ManageRecords records={records} setRecords={setRecords} />} />
            <Route path="/trends" element={<Trends records={records} setRecords={setRecords} />} />
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
  const [selectedId, setSelectedId] = useState<string>(() => {
    return records.length > 0 ? records[records.length - 1].id : '';
  });

  const currentRecord = useMemo(() => {
    return records.find(r => r.id === selectedId) || records[records.length - 1];
  }, [records, selectedId]);

  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const { metrics, totalAssetsChartData, disposableAssetsChartData } = useMemo(() => {
    if (!currentRecord) return { groups: [], metrics: { totalAssets: 0, disposableAssets: 0, totalMarketIndex: 0 }, totalAssetsChartData: [], disposableAssetsChartData: [] };
    return calculateQuarterMetrics(currentRecord);
  }, [currentRecord]);

  const handleGetAdvice = async () => {
    if (!currentRecord) return;
    setLoadingAdvice(true);
    const result = await getFinancialAdvice(currentRecord, metrics);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  // 优化后的响应式双行标签
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25; // 增加间距
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const isMobile = window.innerWidth < 768;

    return (
      <text
        x={x}
        y={y}
        fill="#475569"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: 600 }}
      >
        <tspan x={x} dy="-0.6em">{name}</tspan>
        <tspan x={x} dy="1.2em" fill="#6366f1">{(percent * 100).toFixed(0)}%</tspan>
      </text>
    );
  };

  if (records.length === 0) {
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

  const isMobile = window.innerWidth < 768;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">财务报告</span>
            <h1 className="text-3xl font-bold mt-1">财务总览</h1>
          </div>
          
          <div className="relative group min-w-[140px]">
            <select 
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setAdvice(null); // Reset advice when changing quarter
              }}
              className="appearance-none bg-white border border-slate-200 px-4 py-2 pr-10 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:outline-none shadow-sm cursor-pointer"
            >
              {[...records].reverse().map(r => (
                <option key={r.id} value={r.id}>{r.id}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
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
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">总资产分布</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={totalAssetsChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 40 : 50}
                  outerRadius={isMobile ? 65 : 80}
                  paddingAngle={5}
                  dataKey="value"
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {totalAssetsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} layout="horizontal" align="center" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">可支配资产分布</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={disposableAssetsChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 40 : 50}
                  outerRadius={isMobile ? 65 : 80}
                  paddingAngle={5}
                  dataKey="value"
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {disposableAssetsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} layout="horizontal" align="center" verticalAlign="bottom" />
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
              <h3 className="font-bold">理财建议 ({selectedId})</h3>
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
    const lastUsed = localStorage.getItem('wealth_tracker_last_quarter');
    if (lastUsed) return lastUsed;
    const d = new Date();
    const q = Math.floor(d.getMonth() / 3) + 1;
    return `${d.getFullYear()}-Q${q}`;
  });

  const [data, setData] = useState<QuarterData>(createEmptyQuarterData());
  const [activeTab, setActiveTab] = useState<CategoryId>(CategoryId.CASH_NO_INTEREST);

  // Sync with existing record if available when quarterId changes
  useEffect(() => {
    localStorage.setItem('wealth_tracker_last_quarter', quarterId);
    const existing = records.find(r => r.id === quarterId);
    if (existing) {
      setData(JSON.parse(JSON.stringify(existing.data))); // Deep copy
    } else {
      setData(createEmptyQuarterData());
    }
  }, [quarterId, records]);

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
    alert(`季度 ${quarterId} 记录已保存！`);
  };

  const groupTotals = useMemo(() => {
    const catTotals: Record<string, number> = {};
    Object.values(CategoryId).forEach(id => {
      catTotals[id] = sumEntries(data[id]);
    });
    return catTotals;
  }, [data]);

  const hasExistingData = records.some(r => r.id === quarterId);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-40">
      <header className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            季度资产登记
            {hasExistingData && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">编辑模式</span>}
          </h1>
          <p className="text-sm text-slate-500">记录本季度各项资产分项</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
             <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
              type="text" 
              value={quarterId} 
              onChange={e => setQuarterId(e.target.value.toUpperCase())}
              placeholder="例如: 2025-Q2"
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-700"
            />
          </div>
          <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-transform">
            保存记录
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 flex md:flex-col overflow-x-auto gap-2 pb-2 md:pb-0 scrollbar-hide">
          {Object.entries(CATEGORY_METADATA).map(([id, meta]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as CategoryId)}
              className={`flex-shrink-0 md:w-full text-left px-4 py-3 rounded-2xl flex flex-col transition-all border ${activeTab === id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'}`}
            >
              <span className={`text-[10px] font-bold uppercase ${activeTab === id ? 'text-indigo-200' : 'text-slate-400'}`}>{meta.group}</span>
              <span className="font-semibold whitespace-nowrap">{meta.label}</span>
            </button>
          ))}
        </div>

        <div className="md:col-span-3 bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">{CATEGORY_METADATA[activeTab].label}</h3>
            <span className="text-xl font-black text-indigo-600">{formatCurrency(groupTotals[activeTab])}</span>
          </div>

          <div className="space-y-4">
            {data[activeTab].map((entry) => (
              <div key={entry.id} className="flex gap-2 items-center animate-in fade-in slide-in-from-top-1 duration-200">
                <input
                  type="text"
                  value={entry.label}
                  onChange={e => updateEntry(activeTab, entry.id, 'label', e.target.value)}
                  placeholder="名称"
                  className="w-28 md:w-40 px-4 py-3 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-indigo-100 focus:outline-none bg-slate-50 text-sm"
                />
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">¥</span>
                  <input
                    type="number"
                    value={entry.value === 0 ? '' : entry.value}
                    onChange={e => updateEntry(activeTab, entry.id, 'value', Number(e.target.value))}
                    placeholder="请输入金额"
                    className="w-full px-4 py-3 pl-7 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-indigo-100 focus:outline-none bg-slate-50 font-bold text-sm"
                  />
                </div>
                <button onClick={() => deleteEntry(activeTab, entry.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            <button 
              onClick={() => handleAddEntry(activeTab)}
              className="w-full border-2 border-dashed border-slate-100 py-4 rounded-2xl text-slate-400 font-semibold flex items-center justify-center gap-2 hover:border-indigo-200 hover:text-indigo-500 transition-all active:bg-slate-50"
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

/* --- ManageRecords Component --- */
const ManageRecords: React.FC<{ records: WealthRecord[], setRecords: React.Dispatch<React.SetStateAction<WealthRecord[]>> }> = ({ records, setRecords }) => {
  const [selectedId, setSelectedId] = useState<string>(() => {
    return records.length > 0 ? records[records.length - 1].id : '';
  });

  const record = useMemo(() => {
    return records.find(r => r.id === selectedId);
  }, [records, selectedId]);

  const handleDeleteRecord = (id: string) => {
    if (window.confirm(`确定要永久删除 ${id} 的所有资产数据吗？该操作不可撤销。`)) {
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      if (selectedId === id && updated.length > 0) {
        setSelectedId(updated[updated.length - 1].id);
      } else if (updated.length === 0) {
        setSelectedId('');
      }
    }
  };

  const handleDeleteEntry = (catId: string, entryId: string) => {
    if (window.confirm('确定要删除这个细项吗？')) {
      setRecords(prev => prev.map(r => {
        if (r.id === selectedId) {
          return {
            ...r,
            data: {
              ...r.data,
              [catId]: r.data[catId as CategoryId].filter(e => e.id !== entryId)
            }
          };
        }
        return r;
      }));
    }
  };

  if (records.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[60vh]">
         <div className="bg-slate-100 p-6 rounded-full mb-4"><FileText size={40} className="text-slate-400" /></div>
         <p>暂无记录。请先添加资产数据。</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-40">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">记录详情</h1>
          <p className="text-slate-500">查看与管理每一季度的详细输入</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="appearance-none bg-white border border-slate-200 pl-4 pr-10 py-3 rounded-2xl font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-100 focus:outline-none"
            >
              {[...records].reverse().map(r => (
                <option key={r.id} value={r.id}>{r.id}</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button 
            onClick={() => handleDeleteRecord(selectedId)}
            className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors shadow-sm"
            title="删除该季度记录"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      {record && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {Object.entries(record.data).map(([catId, entries]) => {
            if (entries.length === 0) return null;
            const meta = CATEGORY_METADATA[catId as CategoryId];
            const total = sumEntries(entries);
            
            return (
              <div key={catId} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 rounded-full" style={{ backgroundColor: meta.color }}></div>
                    <span className="font-bold text-slate-800">{meta.label}</span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-slate-400 uppercase border border-slate-100">{meta.group}</span>
                  </div>
                  <span className="font-black text-indigo-600">{formatCurrency(total)}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {entries.map((entry) => (
                    <div key={entry.id} className="px-6 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors group">
                      <span className="text-sm font-medium text-slate-600">{entry.label || '(未命名分项)'}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-700">{formatCurrency(entry.value)}</span>
                        <button 
                          onClick={() => handleDeleteEntry(catId, entry.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* --- Trends Component --- */
const Trends: React.FC<{ records: WealthRecord[], setRecords: React.Dispatch<React.SetStateAction<WealthRecord[]>> }> = ({ records, setRecords }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wealth-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json) && window.confirm('导入数据将覆盖当前所有记录，确定吗？')) {
          setRecords(json);
          alert('导入成功！');
        }
      } catch (err) {
        alert('无效的 JSON 文件');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearAll = () => {
    if (window.confirm('警告：此操作将永久删除所有本地资产记录，无法撤销！建议先导出备份。确定要清空吗？')) {
      setRecords([]);
      localStorage.removeItem('wealth_tracker_records');
    }
  };

  const handleAppRefresh = () => {
    if (window.confirm('将重新加载应用以检查更新。未保存的输入可能会丢失，确定吗？')) {
      window.location.reload();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-40">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">趋势分析</h1>
        <p className="text-slate-500">资产季度增长变化图</p>
      </header>

      {records.length > 0 ? (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-8">
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
                <Line type="monotone" dataKey="指数" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 mb-8">
          需要至少 2 条记录来展示趋势
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* History Quick List */}
        <div className="space-y-4">
          <h4 className="font-bold flex items-center gap-2 px-1 text-slate-700">
            <History size={18} />
            最近记录
          </h4>
          {[...records].reverse().slice(0, 5).map(r => {
            const { metrics } = calculateQuarterMetrics(r);
            return (
              <div key={r.id} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    {r.id.split('-')[1]}
                  </div>
                  <div>
                    <span className="font-bold block">{r.id}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-tight">Snapshot</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-sm">{formatCurrency(metrics.totalAssets)}</span>
                </div>
              </div>
            );
          })}
          {records.length > 5 && <Link to="/manage" className="block text-center text-indigo-600 text-xs font-bold py-2">查看更多记录详情</Link>}
        </div>

        {/* Data & App Management */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="font-bold flex items-center gap-2 px-1 text-slate-700">
              <Settings size={18} />
              数据与安全
            </h4>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <button 
                onClick={handleExport}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Download size={20} className="text-indigo-500" />
                  <div className="text-left">
                    <span className="font-bold block text-sm">备份数据</span>
                    <span className="text-[10px] text-slate-400">导出 JSON 文件</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-300" />
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Upload size={20} className="text-emerald-500" />
                  <div className="text-left">
                    <span className="font-bold block text-sm">还原数据</span>
                    <span className="text-[10px] text-slate-400">从备份导入</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-300" />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />

              <button 
                onClick={handleClearAll}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <AlertTriangle size={20} />
                <span className="font-bold text-sm">清空本地记录</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold flex items-center gap-2 px-1 text-slate-700">
              <Cpu size={18} />
              系统
            </h4>
            <div className="bg-slate-900 p-6 rounded-3xl text-slate-300 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-black mb-1">Version</p>
                  <p className="text-xl font-mono font-bold text-white">{APP_VERSION}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-[10px] uppercase font-black mb-1">Built</p>
                  <p className="text-sm font-mono text-slate-400">{BUILD_DATE}</p>
                </div>
              </div>
              <button onClick={handleAppRefresh} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95">
                <RefreshCw size={18} />
                <span className="font-bold text-sm">刷新并检查更新</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
