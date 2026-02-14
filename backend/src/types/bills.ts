// src/types/bills.ts

export type BillStatus = 'upcoming' | 'pending' | 'paid' | 'overdue';
export type BillType = 'Building Maintenance' | 'Electricity' | 'Water' | 'Gas' | 'Security' | 'Internet' | 'Garbage' | 'Maintenance Fee';

export interface Bill {
  id: number;
  type: BillType;
  title: string;
  building_id: number;
  building_name: string;
  amount: number;
  due_date: string;
  status: BillStatus;
  provider?: string;
  account_number?: string;
  month?: string;
  consumption?: string;
  description?: string;
  paid_date?: string;
  paid_amount?: number;
}

export interface BillStats {
  total: number;
  upcoming: number;
  pending: number;
  paid: number;
  overdue: number;
  totalAmount: number;
}

export const formatCurrency = (amount: number): string => {
  return `৳${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const getBillTypeIcon = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'building maintenance':
    case 'maintenance fee':
      return '🔧';
    case 'gas':
      return '🔥';
    case 'electricity':
      return '⚡';
    case 'water':
      return '💧';
    case 'security':
      return '🛡️';
    case 'internet':
      return '🌐';
    case 'garbage':
      return '🗑️';
    default:
      return '📄';
  }
};

export const getStatusColor = (status: BillStatus): string => {
  switch (status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'overdue':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'pending':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'upcoming':
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};