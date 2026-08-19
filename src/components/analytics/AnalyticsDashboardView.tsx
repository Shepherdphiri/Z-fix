import React from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Activity,
  BarChart3,
  TrendingUp,
  Cpu,
  Database,
  CheckCircle,
  Users,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export const AnalyticsDashboardView: React.FC = () => {
  const { analyticsData } = useStudio();

  const summary = analyticsData?.summary || {
    activeUsers24h: 3,
    totalProjects: 154,
    aiOperationsTotal: 482,
    batchJobsProcessed: 114,
    avgLatencyMs: 412,
    cloudStorageUsedMB: 5150,
    cloudStorageTotalMB: 62000,
    userEngagementGrowth: 28.4,
    apiSuccessRate: 99.7,
  };

  const weeklyActivity = analyticsData?.weeklyActivity || [
    { day: 'Mon', edits: 142, batchImages: 320, aiFilters: 210 },
    { day: 'Tue', edits: 188, batchImages: 450, aiFilters: 280 },
    { day: 'Wed', edits: 220, batchImages: 510, aiFilters: 340 },
    { day: 'Thu', edits: 275, batchImages: 680, aiFilters: 410 },
    { day: 'Fri', edits: 310, batchImages: 820, aiFilters: 490 },
    { day: 'Sat', edits: 240, batchImages: 490, aiFilters: 360 },
    { day: 'Sun', edits: 190, batchImages: 380, aiFilters: 290 },
  ];

  const filterUsage = analyticsData?.filterUsage || [
    { name: 'Smart HDR Auto', count: 432 },
    { name: 'Portra 400 Film', count: 320 },
    { name: 'Studio Rembrandt', count: 285 },
    { name: 'Teal & Orange', count: 240 },
    { name: 'Tone Curves Pro', count: 195 },
    { name: 'HSL Color Balance', count: 172 },
  ];

  const latencyHistory = analyticsData?.latencyHistory || [
    { time: '00:00', latency: 380, requests: 45 },
    { time: '04:00', latency: 310, requests: 22 },
    { time: '08:00', latency: 420, requests: 110 },
    { time: '12:00', latency: 480, requests: 245 },
    { time: '16:00', latency: 440, requests: 312 },
    { time: '20:00', latency: 395, requests: 198 },
    { time: '24:00', latency: 350, requests: 88 },
  ];

  return (
    <div className="flex-1 h-full bg-[#0a0a0b] flex flex-col overflow-y-auto text-[#e4e4e7] select-none">
      {/* Top Header */}
      <div className="p-4 md:p-6 border-b border-[#27272a] bg-[#09090b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white font-mono tracking-tight">
              PERFORMANCE & USER ENGAGEMENT ANALYTICS
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-black text-indigo-400 border border-indigo-500/40 uppercase">
              Real-Time Telemetry
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            System performance telemetry, GPU acceleration metrics, AI inference latency, and tool engagement analytics.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Active Pro Users</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{summary.activeUsers24h}</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
              <TrendingUp className="w-3 h-3" /> +{summary.userEngagementGrowth}% this week
            </div>
          </div>

          <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>AI Operations Total</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{summary.aiOperationsTotal}</div>
            <div className="text-[11px] text-zinc-500 font-mono">99.7% Success Rate</div>
          </div>

          <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Batch Images Graded</span>
              <Layers className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {summary.batchJobsProcessed}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">High-throughput queue</div>
          </div>

          <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Average Latency</span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{summary.avgLatencyMs} ms</div>
            <div className="text-[11px] text-emerald-400 font-mono">WebGL GPU Native</div>
          </div>
        </div>

        {/* Charts Row 1: Weekly Volume & Filter Popularity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Creative Throughput Area Chart */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 shadow-lg space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
              Weekly Creative Volume Breakdown
            </span>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyActivity}>
                  <defs>
                    <linearGradient id="colorEdits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBatch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderColor: '#27272a',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#e4e4e7',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="batchImages"
                    stroke="#818cf8"
                    fillOpacity={1}
                    fill="url(#colorBatch)"
                    name="Batch Images"
                  />
                  <Area
                    type="monotone"
                    dataKey="aiFilters"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorEdits)"
                    name="AI Filters Applied"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filter & AI Feature Usage Bar Chart */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 shadow-lg space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
              AI Filter & Tool Engagement
            </span>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filterUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={10} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderColor: '#27272a',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#e4e4e7',
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Usage Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2: Latency History Line Chart & Storage Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latency History */}
          <div className="lg:col-span-2 bg-[#18181b] border border-[#27272a] rounded-lg p-4 shadow-lg space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
              24-Hour Response Latency Telemetry
            </span>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} unit="ms" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderColor: '#27272a',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#e4e4e7',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 3 }}
                    name="Latency (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Storage Distribution */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 shadow-lg space-y-3 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
              PostgreSQL Cloud Vault
            </span>

            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <PieChart width={144} height={144}>
                  <Pie
                    data={[
                      { name: 'Used', value: summary.cloudStorageUsedMB },
                      { name: 'Free', value: summary.cloudStorageTotalMB - summary.cloudStorageUsedMB },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="#27272a" />
                  </Pie>
                </PieChart>
                <div className="absolute text-center">
                  <div className="text-lg font-bold font-mono text-white">
                    {((summary.cloudStorageUsedMB / summary.cloudStorageTotalMB) * 100).toFixed(1)}%
                  </div>
                  <div className="text-[9px] text-zinc-500 uppercase font-mono">Used</div>
                </div>
              </div>

              <div className="w-full space-y-1 text-xs font-mono mt-3">
                <div className="flex justify-between text-zinc-400">
                  <span>Used:</span>
                  <span className="text-zinc-200">{(summary.cloudStorageUsedMB / 1024).toFixed(2)} GB</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Capacity:</span>
                  <span className="text-zinc-200">{(summary.cloudStorageTotalMB / 1024).toFixed(0)} GB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
