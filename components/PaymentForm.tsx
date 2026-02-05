
import React, { useState, useEffect } from 'react';
import { Payment } from '../types';
import { Plus, X, Save } from 'lucide-react';

interface Props {
  onAdd: (payment: Payment) => void;
  onClose: () => void;
  initialData?: Payment;
  isDarkMode?: boolean;
}

export const PaymentForm: React.FC<Props> = ({ onAdd, onClose, initialData, isDarkMode = true }) => {
  const [formData, setFormData] = useState<Omit<Payment, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    town: 'Munster',
    amount: 0
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date,
        town: initialData.town,
        amount: initialData.amount
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      id: initialData?.id || Math.random().toString(36).substr(2, 9)
    });
    onClose();
  };

  const inputClass = isDarkMode
    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-emerald-500/20 focus:border-emerald-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:ring-emerald-500/10 focus:border-emerald-500';

  const labelClass = isDarkMode ? 'text-slate-300' : 'text-slate-900';

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className={`rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
        <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
          <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {initialData ? 'Edit Payment' : 'New Payment'}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-1">
            <label className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Payment Date</label>
            <input
              type="date"
              required
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all font-bold ${inputClass}`}
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>District / Town</label>
            <select
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all font-bold ${inputClass}`}
              value={formData.town}
              onChange={e => setFormData({ ...formData, town: e.target.value })}
            >
              <option value="Munster">Munster</option>
              <option value="Highland">Highland</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-black uppercase tracking-widest ${labelClass}`}>Net Amount ($)</label>
            <div className="relative">
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>$</span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-4 transition-all font-black ${inputClass}`}
                value={formData.amount || ''}
                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-4 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2"
            >
              {initialData ? <Save size={20} /> : <Plus size={20} />}
              <span>{initialData ? 'Update Record' : 'Save Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
