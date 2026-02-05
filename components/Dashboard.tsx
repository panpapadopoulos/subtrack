
import React, { useMemo } from 'react';
import { Job, Payment } from '../types';
import {
  Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, ComposedChart, Line
} from 'recharts';
import { DollarSign, Briefcase, Clock, Calendar, TrendingUp, BarChart3, Star, ChevronDown, Filter } from 'lucide-react';

interface Props {
  jobs: Job[];
  payments: Payment[];
  isDarkMode?: boolean;
}

const MUNSTER_COLOR = '#ef4444'; // Red
const HIGHLAND_COLOR = '#3b82f6'; // Blue

export const Dashboard: React.FC<Props> = ({ jobs, payments, isDarkMode = true }) => {
  const [period, setPeriod] = React.useState<'current' | 'previous' | 'total'>('total');

  const filteredData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const isAfterAugust = now.getMonth() >= 7; // August is index 7

    // Define School Year Ranges (Aug 1 to July 31)
    let schoolYearStart: Date;
    let prevYearStart: Date;

    if (isAfterAugust) {
      schoolYearStart = new Date(currentYear, 7, 1);
      prevYearStart = new Date(currentYear - 1, 7, 1);
    } else {
      schoolYearStart = new Date(currentYear - 1, 7, 1);
      prevYearStart = new Date(currentYear - 2, 7, 1);
    }

    const schoolYearEnd = new Date(schoolYearStart.getTime());
    schoolYearEnd.setFullYear(schoolYearStart.getFullYear() + 1);
    schoolYearEnd.setDate(schoolYearEnd.getDate() - 1);
    schoolYearEnd.setHours(23, 59, 59);

    const prevYearEnd = new Date(prevYearStart.getTime());
    prevYearEnd.setFullYear(prevYearStart.getFullYear() + 1);
    prevYearEnd.setDate(prevYearEnd.getDate() - 1);
    prevYearEnd.setHours(23, 59, 59);

    const filterByRange = (data: any[], start: Date, end: Date) => {
      return data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end;
      });
    };

    if (period === 'current') {
      return {
        jobs: filterByRange(jobs, schoolYearStart, schoolYearEnd),
        payments: filterByRange(payments, schoolYearStart, schoolYearEnd),
        label: `${schoolYearStart.getFullYear()}-${String(schoolYearStart.getFullYear() + 1).slice(-2)}`
      };
    } else if (period === 'previous') {
      return {
        jobs: filterByRange(jobs, prevYearStart, prevYearEnd),
        payments: filterByRange(payments, prevYearStart, prevYearEnd),
        label: `${prevYearStart.getFullYear()}-${String(prevYearStart.getFullYear() + 1).slice(-2)}`
      };
    }
    return { jobs, payments, label: 'All Time' };
  }, [jobs, payments, period]);

  const statsJobs = filteredData.jobs;
  const statsPayments = filteredData.payments;

  const stats = useMemo(() => {
    const totalEarnings = statsPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalHours = statsJobs.reduce((sum, j) => sum + j.hours, 0);
    const fullDays = statsJobs.filter(j => j.dayType === 1).length;
    const halfDays = statsJobs.filter(j => j.dayType === 0.5).length;

    return {
      totalEarnings,
      totalHours,
      totalJobs: statsJobs.length,
      fullDays,
      halfDays
    };
  }, [statsJobs, statsPayments]);

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}$`;
  };

  const monthlyStats = useMemo(() => {
    const data: Record<string, { key: string, name: string, fullName: string, income: number, count: number }> = {};

    const processDate = (dateStr: string, isPayment: boolean, amount: number = 0) => {
      const d = new Date(dateStr);
      const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      const key = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}`;
      const name = local.toLocaleString('default', { month: 'short' }) + " '" + local.getFullYear().toString().slice(-2);
      const fullName = local.toLocaleString('default', { month: 'long', year: 'numeric' });

      if (!data[key]) {
        data[key] = { key, name, fullName, income: 0, count: 0 };
      }

      if (isPayment) {
        data[key].income += amount;
      } else {
        data[key].count += 1;
      }
    };

    statsPayments.forEach(p => processDate(p.date, true, p.amount));
    statsJobs.forEach(j => processDate(j.date, false));

    return Object.values(data).sort((a, b) => a.key.localeCompare(b.key));
  }, [statsJobs, statsPayments]);

  const weekdayStats = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    statsJobs.forEach(j => {
      const d = new Date(j.date);
      const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      counts[local.getDay()] += 1;
    });

    const data = days.map((name, i) => ({ name, value: counts[i] })).filter(d => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(d.name) || d.value > 0);
    const maxVal = Math.max(...data.map(d => d.value));
    const busyDay = data.length > 0 ? (data.find(d => d.value === maxVal)?.name || 'N/A') : 'N/A';

    return { data, busyDay };
  }, [statsJobs]);

  const districtData = useMemo(() => {
    const counts: Record<string, number> = {};
    statsJobs.forEach(j => {
      counts[j.town] = (counts[j.town] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: name.toLowerCase() === 'munster' ? MUNSTER_COLOR : HIGHLAND_COLOR
    }));
  }, [statsJobs]);

  const classData = useMemo(() => {
    const counts: Record<string, number> = {};
    statsJobs.forEach(j => {
      counts[j.className] = (counts[j.className] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 classes
  }, [statsJobs]);

  return (
    <div className={`space-y-8 animate-in fade-in duration-500`}>
      {/* Period Selector */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[32px] border shadow-sm transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
        }`}>
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}>
            <Filter size={20} />
          </div>
          <div>
            <h3 className={`text-lg font-black leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Dashboard View</h3>
            <p className="text-xs font-bold text-slate-500">Showing data for {filteredData.label}</p>
          </div>
        </div>
        <div className="relative group min-w-[200px]">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className={`w-full appearance-none border-2 rounded-2xl px-6 py-3.5 font-black focus:outline-none transition-all cursor-pointer pr-12 ${isDarkMode
              ? 'bg-slate-800 border-slate-700 text-white focus:border-white/50'
              : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-slate-900'
              }`}
          >
            <option value="current">Current School Year</option>
            <option value="previous">Previous School Year</option>
            <option value="total">Total History</option>
          </select>
          <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-slate-900 transition-colors" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-7 rounded-3xl shadow-sm border flex items-center space-x-5 transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
          <div className="p-4 bg-emerald-100 text-emerald-700 rounded-2xl">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1">Net Earnings</p>
            <p className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(stats.totalEarnings)}</p>
          </div>
        </div>
        <div className={`p-7 rounded-3xl shadow-sm border flex items-center space-x-5 transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
          <div className="p-4 bg-rose-100 text-rose-700 rounded-2xl">
            <Calendar size={28} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1">Total Assignments</p>
            <p className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{stats.totalJobs}</p>
          </div>
        </div>
        <div className={`p-7 rounded-3xl shadow-sm border flex items-center space-x-5 transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
          <div className="p-4 bg-amber-100 text-amber-700 rounded-2xl">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1">Total Hours</p>
            <p className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{stats.totalHours.toFixed(1)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Activity Chart */}
        <div className={`p-8 rounded-3xl shadow-sm border transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <TrendingUp size={24} className={isDarkMode ? 'text-white' : 'text-slate-900'} />
              <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Income & Volume</h3>
            </div>
            <div className="flex items-center space-x-4 text-[10px] font-bold">
              <div className="flex items-center"><div className="w-3 h-3 bg-emerald-500 rounded-sm mr-1"></div> Income</div>
              <div className="flex items-center"><div className={`w-3 h-3 rounded-sm mr-1 ${isDarkMode ? 'bg-white' : 'bg-slate-900'}`}></div> Jobs</div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: isDarkMode ? '#ffffff05' : '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '16px',
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    color: isDarkMode ? '#f8fafc' : '#0f172a'
                  }}
                  labelStyle={{ fontWeight: 900, color: isDarkMode ? '#f8fafc' : '#0f172a', marginBottom: '8px', fontSize: '14px' }}
                  labelFormatter={(label, items) => {
                    const item = items[0]?.payload;
                    return item?.fullName || label;
                  }}
                  formatter={(value: any, name: string) => [name === 'income' ? formatCurrency(value) : value, name === 'income' ? 'Earnings' : 'Jobs']}
                />
                <Bar yAxisId="left" dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="count" stroke={isDarkMode ? '#ffffff' : '#0f172a'} strokeWidth={3} dot={{ r: 4, fill: isDarkMode ? '#ffffff' : '#0f172a' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Work Distribution */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Class Breakdown */}
          <div className={`p-6 rounded-3xl shadow-sm border flex flex-col sm:col-span-2 transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
            }`}>
            <h3 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <Star size={16} className="mr-2 text-amber-500" /> Top Classes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classData.map((item, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                  }`}>
                  <span className={`text-xs font-bold truncate mr-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.name}</span>
                  <span className={`text-xs font-black px-2 py-1 rounded-lg ${isDarkMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}>{item.value}x</span>
                </div>
              ))}
              {classData.length === 0 && <p className="text-xs text-slate-400 italic col-span-2 py-4 text-center">No class data yet</p>}
            </div>
          </div>

          {/* District Pie */}
          <div className={`p-6 rounded-3xl shadow-sm border flex flex-col transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
            }`}>
            <h3 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <Briefcase size={16} className="mr-2 text-slate-400" /> District Split
            </h3>
            <div className="flex-1 min-h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={districtData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value">
                    {districtData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontWeight: 800,
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    color: isDarkMode ? '#f8fafc' : '#0f172a'
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-2">
              <div className="flex items-center text-[10px] font-black text-slate-500">
                <div className="w-2 h-2 rounded-full mr-1 bg-[#ef4444]"></div> Munster
              </div>
              <div className="flex items-center text-[10px] font-black text-slate-500">
                <div className="w-2 h-2 rounded-full mr-1 bg-[#3b82f6]"></div> Highland
              </div>
            </div>
          </div>

          {/* Weekday Distribution */}
          <div className={`p-6 rounded-3xl shadow-sm border flex flex-col transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
            }`}>
            <h3 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <BarChart3 size={16} className="mr-2 text-slate-400" /> Busy: {weekdayStats.busyDay}
            </h3>
            <div className="flex-1 min-h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayStats.data}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: isDarkMode ? '#ffffff05' : '#f8fafc' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontWeight: 800,
                      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                      color: isDarkMode ? '#f8fafc' : '#0f172a'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {weekdayStats.data.map((entry, index) => (
                      <Cell key={index} fill={entry.name === weekdayStats.busyDay ? (isDarkMode ? '#ffffff' : '#0f172a') : (isDarkMode ? '#334155' : '#cbd5e1')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full/Half Breakdown */}
          <div className={`col-span-1 sm:col-span-2 p-6 rounded-3xl shadow-xl flex items-center justify-around border transition-colors ${isDarkMode ? 'bg-white border-white' : 'bg-slate-900 border-slate-900'
            }`}>
            <div className="text-center">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-blue-600' : 'text-blue-400'}`}>Full Days</p>
              <p className={`text-2xl font-black ${isDarkMode ? 'text-slate-900' : 'text-white'}`}>{stats.fullDays}</p>
            </div>
            <div className={`h-8 w-px ${isDarkMode ? 'bg-slate-200' : 'bg-slate-800'}`}></div>
            <div className="text-center">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-amber-600' : 'text-amber-400'}`}>Half Days</p>
              <p className={`text-2xl font-black ${isDarkMode ? 'text-slate-900' : 'text-white'}`}>{stats.halfDays}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
