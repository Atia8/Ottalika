// src/types/payments.ts

// Payment status types
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial';
export type VerificationStatus = 'pending_verification' | 'pending_review' | 'verified' | 'rejected';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'bkash' | 'nagad' | 'rocket' | 'card';

export interface Payment {
  id: number;
  renter_id: number;
  apartment_id: number;
  amount: number;
  month: string;
  due_date: string;
  status: PaymentStatus;
  paid_at?: string;
  payment_method?: PaymentMethod;
  transaction_id?: string;
  verification_status?: VerificationStatus;
}

export interface PaymentConfirmation {
  id: number;
  payment_id: number;
  manager_id?: number;
  status: VerificationStatus;
  verified_at?: string;
  notes?: string;
}

export interface PaymentStats {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  collectionRate: number;
}

// Utility functions
export const formatCurrency = (amount: number): string => {
  if (!amount && amount !== 0) return '৳0';
  return `৳${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
};

export const formatCompactCurrency = (amount: number): string => {
  if (!amount && amount !== 0) return '৳0';
  if (amount >= 1000000) {
    return `৳${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `৳${(amount / 1000).toFixed(1)}K`;
  }
  return `৳${amount}`;
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'overdue': return 'bg-rose-100 text-rose-700 border-rose-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const getVerificationStatusColor = (status: VerificationStatus): string => {
  switch (status) {
    case 'verified': return 'bg-emerald-100 text-emerald-700';
    case 'pending_verification': return 'bg-amber-100 text-amber-700';
    case 'pending_review': return 'bg-blue-100 text-blue-700';
    case 'rejected': return 'bg-rose-100 text-rose-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

export const getPaymentMethodIcon = (method: PaymentMethod): string => {
  switch (method) {
    case 'bank_transfer': return '🏦';
    case 'cash': return '💵';
    case 'bkash': 
    case 'nagad':
    case 'rocket': return '📱';
    case 'card': return '💳';
    default: return '💰';
  }
};