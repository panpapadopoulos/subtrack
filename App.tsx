import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Job, Payment } from './types';
import { parseSubCSV } from './utils/csvParser';
import { Dashboard } from './components/Dashboard';
import { JobForm } from './components/JobForm';
import { PaymentForm } from './components/PaymentForm';
import { fetchData, saveData } from './services/dataService';
import {
  LayoutDashboard,
  List,
  CreditCard,
  PlusCircle,
  FileUp,
  Trash2,
  Calendar,
  MapPin,
  Clock as ClockIcon,
  X,
  Edit2,
  ArrowUpDown,
  Filter,
  Search,
  Loader2,
  DollarSign,
  Download,
  LogOut,
  Settings,
  Moon,
  Sun
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'payments'>('dashboard');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvInput, setCsvInput] = useState('');

  // Job List States (Sorting & Filtering)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterTown, setFilterTown] = useState<string>('All');
  const [filterSchool, setFilterSchool] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI States
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Edit states
  const [editingJob, setEditingJob] = useState<Job | undefined>();
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>();

  // Loading and saving state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<any>(null);
  const isInitialMount = useRef(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchData();
      setJobs(data.jobs || []);
      setPayments(data.payments || []);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Debounced save function
  const debouncedSave = useCallback((jobsToSave: Job[], paymentsToSave: Payment[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      await saveData({ jobs: jobsToSave, payments: paymentsToSave });
      setIsSaving(false);
    }, 500); // Debounce 500ms
  }, []);

  // Save data when jobs or payments change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!isLoading) {
      debouncedSave(jobs, payments);
    }
  }, [jobs, payments, isLoading, debouncedSave]);

  const handleImport = () => {
    const { jobs: parsedJobs, payments: parsedPayments } = parseSubCSV(csvInput);
    setJobs(prev => [...prev, ...parsedJobs]);
    setPayments(prev => [...prev, ...parsedPayments]);
    setCsvInput('');
    setShowImport(false);
  };

  const handleSaveJob = (job: Job) => {
    if (editingJob) {
      setJobs(prev => prev.map(j => j.id === job.id ? job : j));
      setEditingJob(undefined);
    } else {
      setJobs(prev => [job, ...prev]);
    }
  };

  const handleSavePayment = (payment: Payment) => {
    if (editingPayment) {
      setPayments(prev => prev.map(p => p.id === payment.id ? payment : p));
      setEditingPayment(undefined);
    } else {
      setPayments(prev => [payment, ...prev]);
    }
  };

  const exportAllDataCSV = () => {
    // 1. Assignments Section
    const jobHeaders = ['--- ASSIGNMENTS ---'];
    const jobSubHeaders = ['Date', 'Class', 'Teacher', 'School', 'District', 'Type', 'Hours', 'From', 'To'];
    const jobRows = jobs.map(j => [
      j.date,
      `"${j.className}"`,
      `"${j.teacher}"`,
      `"${j.school}"`,
      j.town,
      j.dayType === 1 ? 'Full Day' : 'Half Day',
      j.hours,
      j.fromTime,
      j.toTime
    ]);

    // 2. Payments Section
    const paymentHeaders = ['', '--- PAYMENTS ---'];
    const paymentSubHeaders = ['Date', 'District', 'Amount'];
    const paymentRows = payments.map(p => [
      p.date,
      p.town,
      p.amount
    ]);

    const csvContent = [
      jobHeaders,
      jobSubHeaders,
      ...jobRows,
      paymentHeaders,
      paymentSubHeaders,
      ...paymentRows
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `subtrack_backup_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteJob = (id: string) => {
    if (confirm('Permanently delete this assignment?')) {
      setJobs(prev => prev.filter(j => j.id !== id));
    }
  };

  const deletePayment = (id: string) => {
    if (confirm('Permanently delete this payment record?')) {
      setPayments(prev => prev.filter(p => p.id !== id));
    }
  };

  // Derived Filtered & Sorted Jobs
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Filter by Town
    if (filterTown !== 'All') {
      result = result.filter(j => j.town === filterTown);
    }

    // Filter by School
    if (filterSchool !== 'All') {
      result = result.filter(j => j.school === filterSchool);
    }

    // Filter by Search (Teacher or Class)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j =>
        j.teacher.toLowerCase().includes(q) ||
        j.className.toLowerCase().includes(q) ||
        j.school.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [jobs, sortOrder, filterTown, filterSchool, searchQuery]);

  // Unique schools and classes for autocomplete
  const { uniqueSchools, uniqueClasses } = useMemo(() => {
    return {
      uniqueSchools: Array.from(new Set(jobs.map(j => j.school))).sort(),
      uniqueClasses: Array.from(new Set(jobs.map(j => j.className))).sort()
    };
  }, [jobs]);

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    // Correcting for local timezone offset which often causes Date to shift back by 1 day
    const utcDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    return {
      month: utcDate.toLocaleString('default', { month: 'short' }),
      day: utcDate.getDate(),
      year: utcDate.getFullYear()
    };
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="bg-white p-4 rounded-2xl text-slate-900 mx-auto w-fit">
            <Calendar size={32} className="animate-pulse" />
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="font-bold">Loading your data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col w-80 p-8 border-r transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center space-x-4 mb-2">
          {/* Custom SVG Logo */}
          <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl">
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 30C20 24.4772 24.4772 20 30 20H70C75.5228 20 80 24.4772 80 30V70C80 75.5228 75.5228 80 70 80H30C24.4772 80 20 75.5228 20 70V30Z" fill="white" />
              <path d="M40 35H60V65H40V35Z" fill="#0f172a" />
              <path d="M30 45H70V55H30V45Z" fill="#0f172a" />
              <circle cx="50" cy="50" r="10" fill="white" />
              <path d="M50 42V58M42 50H58" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className={`text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>SubTrack</h1>
        </div>

        <nav className="flex-1 space-y-2 mt-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'jobs', label: 'Assignments', icon: List },
            { id: 'payments', label: 'Payments', icon: CreditCard },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all ${activeTab === tab.id
                ? (isDarkMode ? 'bg-white text-slate-900 shadow-xl font-black' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 font-black')
                : (isDarkMode ? 'text-slate-400 hover:bg-white/5 font-bold' : 'text-slate-600 hover:bg-slate-100 font-bold')
                }`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className={`mt-auto pt-6 border-t space-y-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          {isSaving && (
            <div className="flex items-center space-x-2 px-5 py-2 text-slate-400 text-sm">
              <Loader2 size={14} className="animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          <button onClick={() => setShowSettings(true)} className={`w-full flex items-center space-x-3 px-5 py-3 rounded-xl transition-all font-bold ${isDarkMode ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100'}`}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <a href="/logout" className={`w-full flex items-center space-x-3 px-5 py-3 rounded-xl transition-all font-bold ${isDarkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'}`}>
            <LogOut size={18} />
            <span>Log Out</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 p-4 md:p-12 pb-24 md:pb-12 overflow-y-auto max-w-7xl mx-auto w-full transition-colors ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-10 gap-6">
          <div>
            <h2 className="text-4xl font-black capitalize tracking-tight">{activeTab === 'jobs' ? 'Assignments' : activeTab}</h2>
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-bold mt-1`}>Welcome Panagiotis</p>
          </div>
          <div className="flex space-x-3">
            {activeTab === 'jobs' && (
              <button onClick={() => setShowJobForm(true)} className={`px-6 py-3.5 rounded-2xl font-black flex items-center space-x-2 shadow-xl transition-all text-sm ${isDarkMode ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-black'}`}>
                <PlusCircle size={18} />
                <span>Log New Job</span>
              </button>
            )}
            {activeTab === 'payments' && (
              <button onClick={() => setShowPaymentForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-black flex items-center space-x-2 shadow-xl transition-all text-sm">
                <PlusCircle size={18} />
                <span>Log Payment</span>
              </button>
            )}
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard jobs={jobs} payments={payments} isDarkMode={isDarkMode} />}

        {activeTab === 'jobs' && (
          <div className="space-y-6">
            {/* Filter & Sort Bar */}
            <div className={`p-4 rounded-2xl shadow-sm border flex flex-wrap items-center gap-4 transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search class or teacher..."
                  className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 font-bold transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-white/5 focus:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-slate-900/5 focus:border-slate-400'}`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className={`flex items-center space-x-2 border p-1 rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <Filter size={16} className="ml-2 text-slate-400" />
                <select
                  className={`bg-transparent border-none text-xs font-black uppercase tracking-widest focus:ring-0 cursor-pointer py-1 pr-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                  value={filterTown}
                  onChange={e => setFilterTown(e.target.value)}
                >
                  <option value="All">All Districts</option>
                  <option value="Munster">Munster</option>
                  <option value="Highland">Highland</option>
                </select>
              </div>

              <div className={`flex items-center space-x-2 border p-1 rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <select
                  className={`bg-transparent border-none text-xs font-black uppercase tracking-widest focus:ring-0 cursor-pointer py-1 pr-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                  value={filterSchool}
                  onChange={e => setFilterSchool(e.target.value)}
                >
                  <option value="All">All Schools</option>
                  {uniqueSchools.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${isDarkMode ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-black'}`}
              >
                <ArrowUpDown size={14} />
                <span>{sortOrder === 'desc' ? 'Latest First' : 'Oldest First'}</span>
              </button>
            </div>

            {filteredJobs.length === 0 ? (
              <div className={`p-24 rounded-[40px] border-2 border-dashed text-center space-y-4 transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                <Calendar size={64} className={`mx-auto ${isDarkMode ? 'text-slate-700' : 'text-slate-200'}`} />
                <p className={`font-black text-2xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>No assignments match your criteria.</p>
                <p className="text-slate-500 font-bold max-w-sm mx-auto">Try clearing your filters or adding a new job.</p>
                {(filterTown !== 'All' || filterSchool !== 'All' || searchQuery) && (
                  <button
                    onClick={() => { setFilterTown('All'); setFilterSchool('All'); setSearchQuery(''); }}
                    className={`font-black underline mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {filteredJobs.map(job => {
                  const dateInfo = formatDateLabel(job.date);
                  return (
                    <div key={job.id} className={`p-7 rounded-3xl shadow-sm border flex flex-col lg:flex-row lg:items-center justify-between hover:shadow-xl transition-all group ${isDarkMode ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                      <div className="flex items-start space-x-6">
                        <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 shadow-sm border-2 ${job.town.toLowerCase() === 'munster'
                          ? 'bg-rose-50 text-rose-600 border-rose-100'
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                          <span className="text-[10px] opacity-60 uppercase tracking-tighter">{dateInfo.month}</span>
                          <span className="text-xl leading-none">{dateInfo.day}</span>
                          <span className="text-[9px] font-bold mt-0.5 opacity-80">{dateInfo.year}</span>
                        </div>
                        <div className="space-y-2">
                          <h4 className={`font-black text-xl leading-none flex items-center flex-wrap gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {job.className}
                            <span className={`font-bold text-base px-2 border-l ${isDarkMode ? 'text-slate-400 border-slate-700' : 'text-slate-400 border-slate-200'}`}>w/ {job.teacher}</span>
                          </h4>
                          <div className="flex flex-wrap gap-3">
                            <span className={`text-xs font-black flex items-center px-3 py-1.5 rounded-xl ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                              <MapPin size={14} className="mr-1.5 text-slate-400" /> {job.school}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl self-center ${job.town.toLowerCase() === 'munster' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
                              }`}>
                              {job.town}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`flex items-center space-x-8 mt-6 lg:mt-0 pt-6 lg:pt-0 border-t lg:border-t-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Range</p>
                          <p className={`text-sm font-bold flex items-center justify-end ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                            <ClockIcon size={14} className="mr-1.5 text-slate-400" /> {job.fromTime} - {job.toTime}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hours</p>
                          <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{job.hours.toFixed(1)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => setEditingJob(job)} className={`p-2.5 text-slate-400 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${isDarkMode ? 'hover:text-white hover:bg-slate-800' : 'hover:text-slate-900 hover:bg-slate-100'}`}>
                            <Edit2 size={20} />
                          </button>
                          <button onClick={() => deleteJob(job.id)} className={`p-2.5 text-slate-500 hover:text-rose-600 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${isDarkMode ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'}`}>
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className={`p-4 rounded-2xl shadow-sm border flex items-center justify-between gap-4 transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`flex items-center space-x-2 border p-1 rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <Filter size={16} className="ml-2 text-slate-400" />
                <select
                  className={`bg-transparent border-none text-xs font-black uppercase tracking-widest focus:ring-0 cursor-pointer py-1 pr-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                  value={filterTown}
                  onChange={e => setFilterTown(e.target.value)}
                >
                  <option value="All">All Districts</option>
                  <option value="Munster">Munster</option>
                  <option value="Highland">Highland</option>
                </select>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Showing Latest First</p>
            </div>

            <div className={`rounded-[40px] shadow-sm border overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment Date</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">District</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Net Amount</th>
                      <th className="px-10 py-6 w-32"></th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {(() => {
                      let p = [...payments];
                      if (filterTown !== 'All') {
                        p = p.filter(pay => pay.town === filterTown);
                      }
                      p.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                      if (p.length === 0) {
                        return <tr><td colSpan={4} className="px-10 py-32 text-center text-slate-400 font-bold italic">No earnings logged {filterTown !== 'All' ? `for ${filterTown}` : ''} yet.</td></tr>;
                      }

                      return p.map(payment => (
                        <tr key={payment.id} className={`transition-colors group ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'}`}>
                          <td className={`px-10 py-6 font-black text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {formatDateLabel(payment.date).month} {formatDateLabel(payment.date).day}, {formatDateLabel(payment.date).year}
                          </td>
                          <td className="px-10 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${payment.town.toLowerCase() === 'munster' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                              {payment.town}
                            </span>
                          </td>
                          <td className="px-10 py-6 text-right font-black text-emerald-500 text-2xl">
                            {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 1 })}$
                          </td>
                          <td className="px-10 py-6 text-right space-x-1">
                            <button onClick={() => setEditingPayment(payment)} className={`p-2.5 text-slate-400 transition-all opacity-0 group-hover:opacity-100 ${isDarkMode ? 'hover:text-white' : 'hover:text-slate-900'}`}>
                              <Edit2 size={20} />
                            </button>
                            <button onClick={() => deletePayment(payment.id)} className="p-2.5 text-slate-500 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 size={20} />
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Forms & Modals */}
      {(showJobForm || editingJob) && (
        <JobForm
          onAdd={handleSaveJob}
          onClose={() => { setShowJobForm(false); setEditingJob(undefined); }}
          initialData={editingJob}
          uniqueSchools={uniqueSchools}
          uniqueClasses={uniqueClasses}
          isDarkMode={isDarkMode}
        />
      )}
      {(showPaymentForm || editingPayment) && (
        <PaymentForm
          onAdd={handleSavePayment}
          onClose={() => { setShowPaymentForm(false); setEditingPayment(undefined); }}
          initialData={editingPayment}
          isDarkMode={isDarkMode}
        />
      )}

      {showImport && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`rounded-[40px] w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className={`p-10 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Bulk Import</h2>
              <button onClick={() => setShowImport(false)} className="p-3 hover:bg-slate-200 rounded-full text-slate-400 transition-all">
                <X size={28} />
              </button>
            </div>
            <div className="p-10 space-y-8">
              <textarea
                className={`w-full h-80 p-6 border rounded-3xl font-mono text-xs focus:outline-none focus:ring-4 transition-all leading-relaxed ${isDarkMode
                  ? 'bg-slate-950 border-slate-800 text-slate-200 focus:ring-white/5 focus:border-slate-600'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-slate-900/5 focus:border-slate-900'
                  }`}
                placeholder="Paste CSV row data here..."
                value={csvInput}
                onChange={e => setCsvInput(e.target.value)}
              />
              <div className="flex gap-4">
                <button
                  onClick={handleImport}
                  disabled={!csvInput.trim()}
                  className="flex-1 bg-white text-slate-900 py-5 rounded-2xl font-black hover:bg-slate-100 transition-all disabled:opacity-30 shadow-2xl shadow-white/10 text-lg"
                >
                  Import Data
                </button>
                <button
                  onClick={() => setShowImport(false)}
                  className={`px-10 py-5 border-2 rounded-2xl font-black transition-all ${isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`rounded-[40px] w-full max-w-xl shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className={`p-10 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-3 hover:bg-slate-200 rounded-full text-slate-400 transition-all">
                <X size={28} />
              </button>
            </div>
            <div className="p-10 space-y-6">
              {/* Theme Toggle */}
              <div className={`p-6 rounded-[32px] border flex items-center justify-between transition-all ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}>
                    {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                  </div>
                  <div>
                    <h4 className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</h4>
                    <p className="text-xs font-bold text-slate-500">Theme Preference</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-14 h-8 rounded-full relative transition-all duration-300 ${isDarkMode ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${isDarkMode ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              {/* Data Actions */}
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => { setShowSettings(false); exportAllDataCSV(); }}
                  className={`flex items-center space-x-4 p-5 rounded-2xl border transition-all font-black text-left ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'}`}
                >
                  <Download size={20} className="text-blue-500" />
                  <span>Export All Data (CSV)</span>
                </button>
                <button
                  onClick={() => { setShowSettings(false); setShowImport(true); }}
                  className={`flex items-center space-x-4 p-5 rounded-2xl border transition-all font-black text-left ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'}`}
                >
                  <FileUp size={20} className="text-amber-500" />
                  <span>Import Records</span>
                </button>
                <button
                  onClick={() => { if (confirm('Wipe all local data? This cannot be undone.')) { setJobs([]); setPayments([]); setShowSettings(false); } }}
                  className={`flex items-center space-x-4 p-5 rounded-2xl border transition-all font-black text-left ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-rose-500 hover:bg-rose-500/10' : 'bg-white border-slate-200 text-red-600 hover:bg-red-50'}`}
                >
                  <Trash2 size={20} />
                  <span>Wipe All Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Nav */}
      <nav className={`md:hidden fixed bottom-6 left-6 right-6 rounded-[32px] flex justify-around p-4 z-40 shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <button onClick={() => setActiveTab('dashboard')} className={`p-3 rounded-2xl ${activeTab === 'dashboard' ? (isDarkMode ? 'text-white bg-white/10' : 'text-slate-900 bg-slate-100') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>
          <LayoutDashboard size={24} />
        </button>
        <button onClick={() => setActiveTab('jobs')} className={`p-3 rounded-2xl ${activeTab === 'jobs' ? (isDarkMode ? 'text-white bg-white/10' : 'text-slate-900 bg-slate-100') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>
          <List size={24} />
        </button>
        <button onClick={() => setActiveTab('payments')} className={`p-3 rounded-2xl ${activeTab === 'payments' ? (isDarkMode ? 'text-white bg-white/10' : 'text-slate-900 bg-slate-100') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>
          <CreditCard size={24} />
        </button>
        <button onClick={() => setShowSettings(true)} className={`p-3 rounded-2xl ${showSettings ? (isDarkMode ? 'text-white bg-white/10' : 'text-slate-900 bg-slate-100') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>
          <Settings size={24} />
        </button>
      </nav>
    </div>
  );
};

export default App;
