
import React, { useState, useEffect } from 'react';
import { Job } from '../types';
import { Plus, X, Save, Clock } from 'lucide-react';

interface Props {
  onAdd: (job: Job) => void;
  onClose: () => void;
  initialData?: Job;
  uniqueSchools?: string[];
  uniqueClasses?: string[];
  isDarkMode?: boolean;
}

export const JobForm: React.FC<Props> = ({ onAdd, onClose, initialData, uniqueSchools = [], uniqueClasses = [], isDarkMode = true }) => {
  const [formData, setFormData] = useState<Omit<Job, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    className: '',
    teacher: '',
    school: '',
    town: 'Munster',
    dayType: 1,
    fromTime: '08:00',
    toTime: '15:00',
    hours: 7
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date,
        className: initialData.className,
        teacher: initialData.teacher,
        school: initialData.school,
        town: initialData.town,
        dayType: initialData.dayType,
        fromTime: initialData.fromTime || '08:00',
        toTime: initialData.toTime || '15:00',
        hours: initialData.hours
      });
    }
  }, [initialData]);

  // Handle Automatic Hour Calculation
  useEffect(() => {
    if (formData.fromTime && formData.toTime) {
      const [startH, startM] = formData.fromTime.split(':').map(Number);
      const [endH, endM] = formData.toTime.split(':').map(Number);

      let diffMs = (endH * 60 + endM) - (startH * 60 + startM);
      if (diffMs < 0) diffMs += 24 * 60; // Handle overnight if needed

      const calcHours = Number((diffMs / 60).toFixed(2));
      setFormData(prev => ({ ...prev, hours: calcHours }));
    }
  }, [formData.fromTime, formData.toTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      id: initialData?.id || Math.random().toString(36).substr(2, 9)
    });
    onClose();
  };

  const inputClass = isDarkMode
    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/20 focus:border-blue-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:ring-blue-500/10 focus:border-blue-500';

  const labelClass = isDarkMode ? 'text-slate-300' : 'text-slate-900';

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className={`rounded-3xl w-full max-w-xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
        <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
          <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {initialData ? 'Edit Assignment' : 'New Assignment'}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Job Date</label>
              <input
                type="date"
                required
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all font-bold ${inputClass}`}
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>District</label>
              <select
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all font-bold ${inputClass}`}
                value={formData.town}
                onChange={e => setFormData({ ...formData, town: e.target.value })}
              >
                <option value="Munster">Munster</option>
                <option value="Highland">Highland</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>School Name</label>
            <input
              type="text"
              list="schools-list"
              placeholder="e.g. Eads Elementary"
              required
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all font-bold ${inputClass}`}
              value={formData.school}
              onChange={e => setFormData({ ...formData, school: e.target.value })}
            />
            <datalist id="schools-list">
              {uniqueSchools.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Grade / Class</label>
              <input
                type="text"
                list="classes-list"
                placeholder="e.g. 5th Grade Math"
                required
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all font-bold ${inputClass}`}
                value={formData.className}
                onChange={e => setFormData({ ...formData, className: e.target.value })}
              />
              <datalist id="classes-list">
                {uniqueClasses.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-1">
              <label className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Teacher Name</label>
              <input
                type="text"
                placeholder="e.g. Mrs. Smith"
                required
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all font-bold ${inputClass}`}
                value={formData.teacher}
                onChange={e => setFormData({ ...formData, teacher: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Start Time</label>
              <input
                type="time"
                required
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all font-bold ${inputClass}`}
                value={formData.fromTime}
                onChange={e => setFormData({ ...formData, fromTime: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>End Time</label>
              <input
                type="time"
                required
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all font-bold ${inputClass}`}
                value={formData.toTime}
                onChange={e => setFormData({ ...formData, toTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Duration</label>
              <select
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all font-bold ${inputClass}`}
                value={formData.dayType}
                onChange={e => setFormData({ ...formData, dayType: parseFloat(e.target.value) as 0.5 | 1 })}
              >
                <option value={1}>Full Day</option>
                <option value={0.5}>Half Day</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Total Hours</label>
              <input
                type="number"
                step="0.01"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all font-bold ${inputClass}`}
                value={formData.hours}
                onChange={e => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className={`w-full font-black py-4 px-6 rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 text-lg ${isDarkMode ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-black'}`}
            >
              {initialData ? <Save size={24} /> : <Plus size={24} />}
              <span>{initialData ? 'Update Assignment' : 'Save Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
