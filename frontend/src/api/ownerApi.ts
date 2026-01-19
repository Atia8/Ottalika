// src/api/ownerApi.ts

export interface OwnerPayment {
  id: number;
  apartment_number: string;
  floor: number;
  rent_amount: number;
  renter_id: number;
  renter_name: string;
  renter_email: string;
  renter_phone: string;
  payment_id: number | null;
  payment_status: string | null;
  paid_at: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  confirmation_status: string | null;
  verified_at: string | null;
}

export interface OwnerPaymentsResponse {
  success: boolean;
  month: string;
  summary: {
    total_apartments: number;
    verified_count: number;
    pending_review_count: number;
    unpaid_count: number;
    overdue_count: number;
    total_expected: number;
    total_collected: number;
    collection_percentage: number;
  };
  apartments: OwnerPayment[];
}

export const getOwnerPayments = async (monthDate: string): Promise<OwnerPaymentsResponse> => {
  const token = localStorage.getItem('token'); // fetch JWT token from localStorage
  const res = await fetch(`http://localhost:5000/api/owner/payments?month=${monthDate}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch payments: ${text}`);
  }

  return res.json();
};
