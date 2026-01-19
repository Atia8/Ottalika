export const formatMonthForDisplay = (dateStr: string): string => {
  // "2025-01-01" → "January 2025"
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const parseMonthFromDisplay = (displayMonth: string): string => {
  // "January 2025" → "2025-01-01"
  const [month, year] = displayMonth.split(' ');
  const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
  return `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-01`;
};