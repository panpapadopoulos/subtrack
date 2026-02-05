
import { Job, Payment } from '../types';

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
    
    // Check for Jobs (cols 1-9)
    // Format: ,Date,Class,Teacher,School,Town,Day,From,To,Hours
    if (cols[1] && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cols[1]) && cols[2] && cols[2] !== 'Date' && !cols[2].includes('Total')) {
      jobs.push({
        id: `job-${index}-${Math.random()}`,
        date: normalizeDate(cols[1]),
        className: cols[2],
        teacher: cols[3],
        school: cols[4],
        town: cols[5],
        dayType: parseFloat(cols[6]) as 0.5 | 1,
        fromTime: cols[7],
        toTime: cols[8],
        hours: parseFloat(cols[9]) || 0
      });
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
