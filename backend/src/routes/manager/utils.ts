import { pool } from '../../database/db';

// Database query helper with better error handling
export const dbQuery = async (text: string, params?: any[]) => {
  try {
    console.log('📊 Executing query:', text.substring(0, 200), '...');
    const result = await pool.query(text, params);
    console.log('✅ Query successful, rows:', result.rowCount);
    return result;
  } catch (error: any) {
    console.error('❌ Database query error:', error.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
};

// Validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Bangladeshi phone number format: 01XXXXXXXXX (11 digits starting with 01)
  const phoneRegex = /^01[3-9]\d{8}$/;
  return phoneRegex.test(phone);
};

export const validateNID = (nid: string): boolean => {
  // Bangladeshi NID: 10 or 17 digits
  const nidRegex = /^\d{10}$|^\d{17}$/;
  return nidRegex.test(nid);
};

// Format time ago helper
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    if (diffDays === 1) return 'Yesterday';
    if (diffDays === 2) return '2 days ago';
    if (diffDays === 3) return '3 days ago';
    if (diffDays === 4) return '4 days ago';
    if (diffDays === 5) return '5 days ago';
    if (diffDays === 6) return '6 days ago';
  } else {
    return past.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}