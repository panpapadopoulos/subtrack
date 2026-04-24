
import { Job, Payment } from '../types';
import { getDefaultPayRate } from './payroll';

function normalizeDate(dateStr: string): string {
  // Handles MM/DD/YYYY to YYYY-MM-DD
  if (dateStr.includes('/')) {
    const [m, d, y] = dateStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return dateStr; // Assume already YYYY-MM-DD
}

export function parseSubCSV(csvText: string): { jobs: Job[], payments: Payment[] } {
  const lines = csvText.split('\n');
  const jobs: Job[] = [];
  const payments: Payment[] = [];

  lines.forEach((line, index) => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));

    // Current SubTrack export format:
    // Date,Role,Class,Teacher,School,District,Type,Hours,From,To,Pay Rate,Expected Pay
    const exportedRole = cols[1]?.toLowerCase() || '';
    if (cols[0] && /^\d{4}-\d{2}-\d{2}$/.test(cols[0]) && (exportedRole.includes('teacher') || exportedRole.includes('assistant') || exportedRole.includes('aide')) && cols[2]) {
      const role = exportedRole.includes('assistant') || exportedRole.includes('aide') ? 'aide' : 'teacher';
      jobs.push({
        id: `job-${index}-${Math.random()}`,
        date: cols[0],
        role,
        className: cols[2],
        teacher: cols[3],
        school: cols[4],
        town: cols[5],
        dayType: cols[6].toLowerCase().includes('half') ? 0.5 : 1,
        hours: parseFloat(cols[7]) || 0,
        fromTime: cols[8],
        toTime: cols[9],
        payRate: parseFloat(cols[10]) || getDefaultPayRate(role)
      });
      return;
    }
    
    // Check for Jobs (cols 1-9)
    // Format: ,Date,Class,Teacher,School,Town,Day,From,To,Hours
    if (cols[1] && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cols[1]) && cols[2] && cols[2] !== 'Date' && !cols[2].includes('Total')) {
      jobs.push({
        id: `job-${index}-${Math.random()}`,
        date: normalizeDate(cols[1]),
        role: 'teacher',
        className: cols[2],
        teacher: cols[3],
        school: cols[4],
        town: cols[5],
        dayType: parseFloat(cols[6]) as 0.5 | 1,
        fromTime: cols[7],
        toTime: cols[8],
        hours: parseFloat(cols[9]) || 0,
        payRate: getDefaultPayRate('teacher')
      });
    }

    // Current SubTrack payments export format: Date,District,Amount
    if (cols[0] && /^\d{4}-\d{2}-\d{2}$/.test(cols[0]) && cols[1] && cols[2] && !cols[1].toLowerCase().includes('role')) {
      payments.push({
        id: `pay-${index}-${Math.random()}`,
        date: cols[0],
        town: cols[1],
        amount: parseFloat(cols[2]?.replace(/[$,]/g, '') || '0') || 0
      });
      return;
    }

    // Check for Payments (cols 11-13)
    // Format: ,,Date,School Town,Amount
    if (cols[11] && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cols[11]) && !cols[12].includes('Total')) {
      const amountStr = cols[13]?.replace(/[$,]/g, '') || '0';
      payments.push({
        id: `pay-${index}-${Math.random()}`,
        date: normalizeDate(cols[11]),
        town: cols[12],
        amount: parseFloat(amountStr) || 0
      });
    }
  });

  return { jobs, payments };
}
