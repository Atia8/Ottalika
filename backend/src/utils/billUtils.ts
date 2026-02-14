// backend/src/utils/billUtils.ts

export interface Bill {
  id: number;
  type: string;
  title: string;
  building_id: number;
  building_name: string;
  amount: number;
  due_date: string;
  status: 'upcoming' | 'pending' | 'paid' | 'overdue';
  provider?: string;
  account_number?: string;
  month?: string;
  consumption?: string;
  description?: string;
  paid_date?: string;
  paid_amount?: number;
}

export const parseAmount = (amount: any): number => {
  if (amount === null || amount === undefined) return 0;
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const mockBills: Bill[] = [
  {
    id: 1,
    type: 'Building Maintenance',
    title: 'Building Maintenance',
    building_id: 1,
    building_name: 'Main Building',
    amount: 2000,
    due_date: '2025-02-10',
    status: 'upcoming',
    provider: 'Building Management',
    description: 'Feb 2025 Maintenance Bill'
  },
  {
    id: 2,
    type: 'Gas',
    title: 'Gas Bill',
    building_id: 1,
    building_name: 'Main Building',
    amount: 4000,
    due_date: '2025-11-30',
    status: 'upcoming',
    provider: 'Titas Gas',
    account_number: 'GAS-12345'
  },
  {
    id: 3,
    type: 'Electricity',
    title: 'Electricity Bill',
    building_id: 2,
    building_name: 'Green Valley',
    amount: 15000,
    due_date: '2025-12-05',
    status: 'paid',
    provider: 'National Grid',
    paid_date: '2025-12-01',
    paid_amount: 15000
  },
  {
    id: 4,
    type: 'Water',
    title: 'Water Bill',
    building_id: 1,
    building_name: 'Main Building',
    amount: 6000,
    due_date: '2025-12-07',
    status: 'paid',
    provider: 'WASA',
    paid_date: '2025-12-05',
    paid_amount: 6000
  },
  {
    id: 5,
    type: 'Maintenance Fee',
    title: 'Maintenance Fee',
    building_id: 0,
    building_name: 'All Buildings',
    amount: 10000,
    due_date: '2025-12-10',
    status: 'paid',
    provider: 'Building Management',
    paid_date: '2025-12-08',
    paid_amount: 10000
  },
  {
    id: 6,
    type: 'Security',
    title: 'Security Bill',
    building_id: 0,
    building_name: 'All Buildings',
    amount: 8000,
    due_date: '2025-12-15',
    status: 'paid',
    provider: 'SecureGuard Ltd.',
    paid_date: '2025-12-12',
    paid_amount: 8000
  },
  {
    id: 7,
    type: 'Internet',
    title: 'Internet Bill',
    building_id: 1,
    building_name: 'Main Building',
    amount: 3000,
    due_date: '2026-01-05',
    status: 'upcoming',
    provider: 'Bdcom Online'
  },
  {
    id: 8,
    type: 'Garbage',
    title: 'Garbage Bill',
    building_id: 0,
    building_name: 'All Buildings',
    amount: 2500,
    due_date: '2026-01-10',
    status: 'upcoming',
    provider: 'City Corporation'
  }
];