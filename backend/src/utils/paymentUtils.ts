
// src/utils/paymentUtils.ts
import { PaymentStatus, VerificationStatus } from '../types/payments';

// Map between different status representations
export const statusMap = {
  payment: {
    'pending': 'pending',
    'paid': 'paid',
    'overdue': 'overdue',
    'partial': 'partial'
  } as Record<string, PaymentStatus>,
  verification: {
    'pending_verification': 'pending_verification',
    'pending_review': 'pending_review',
    'verified': 'verified',
    'rejected': 'rejected'
  } as Record<string, VerificationStatus>
};

// Normalize status from API to shared type
export const normalizePaymentStatus = (status: string): PaymentStatus => {
  if (['pending', 'paid', 'overdue', 'partial'].includes(status)) {
    return status as PaymentStatus;
  }
  return 'pending'; // Default
};

export const normalizeVerificationStatus = (status: string): VerificationStatus => {
  if (['pending_verification', 'pending_review', 'verified', 'rejected'].includes(status)) {
    return status as VerificationStatus;
  }
  return 'pending_verification'; // Default
};

// Clean and convert amount from various formats
export const cleanAndConvertAmount = (amount: any): number => {
  if (amount === null || amount === undefined) {
    return 0;
  }
  
  if (typeof amount === 'number') {
    return amount;
  }
  
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  
  const num = Number(amount);
  return isNaN(num) ? 0 : num;
};