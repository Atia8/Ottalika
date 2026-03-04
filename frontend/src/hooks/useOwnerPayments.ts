// frontend/src/hooks/useOwnerPayments.ts
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApartmentPayment {
  id: number;
  apartment_number: string;
  floor: string;
  rent_amount: number;
  renter_id: number | null;
  renter_name: string | null;
  renter_email: string | null;
  renter_phone: string | null;
  payment_id: number | null;
  amount: number | null;
  payment_status: string | null;
  paid_at: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  confirmation_status: string | null;
  verified_at: string | null;
  display_status: string;
  // 👇 ADD THESE FIELDS
  building_id?: number;
  building_name?: string;
}

interface PaymentSummary {
  total_apartments: number;
  verified_count: number;
  pending_review_count: number;
  unpaid_count: number;
  overdue_count: number;
  total_expected: number;
  total_collected: number;
  // 👇 ADD THIS
  building_count?: number;
}

interface PaymentData {
  month: string;
  summary: PaymentSummary;
  apartments: ApartmentPayment[];
  // 👇 ADD THIS
  buildings?: {
    count: number;
    list: string[];
  };
}

interface UseOwnerPaymentsReturn {
  data: PaymentData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useOwnerPayments = (month: string): UseOwnerPaymentsReturn => {
  const [data, setData] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/owner/payments?month=${month}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Transform the data to match what the component expects
        const transformedData: PaymentData = {
          month: result.month,
          summary: {
            total_apartments: result.summary?.total_apartments || 0,
            verified_count: result.summary?.verified_count || 0,
            pending_review_count: result.summary?.pending_review_count || 0,
            unpaid_count: result.summary?.unpaid_count || 0,
            overdue_count: result.summary?.overdue_count || 0,
            total_expected: result.summary?.total_expected || 0,
            total_collected: result.summary?.total_collected || 0,
            // 👇 ADD THIS
            building_count: result.summary?.building_count || 0
          },
          apartments: result.apartments?.map((apt: any) => ({
            id: apt.id,
            apartment_number: apt.apartment_number,
            floor: apt.floor,
            rent_amount: apt.rent_amount,
            renter_id: apt.renter_id,
            renter_name: apt.renter_name,
            renter_email: apt.renter_email,
            renter_phone: apt.renter_phone,
            payment_id: apt.payment_id,
            amount: apt.amount,
            payment_status: apt.payment_status,
            paid_at: apt.paid_at,
            payment_method: apt.payment_method,
            transaction_id: apt.transaction_id,
            confirmation_status: apt.confirmation_status,
            verified_at: apt.verified_at,
            display_status: apt.display_status || 
              (apt.payment_status === 'paid' && apt.confirmation_status === 'verified' ? 'verified' :
               apt.payment_status === 'paid' ? 'pending_verification' :
               apt.payment_status === 'pending' ? 'pending' :
               apt.payment_status === 'overdue' ? 'overdue' : 'no_payment'),
            // 👇 ADD THESE
            building_id: apt.building_id,
            building_name: apt.building_name
          })) || [],
          // 👇 ADD THIS
          buildings: result.buildings || { count: 0, list: [] }
        };
        
        setData(transformedData);
      } else {
        throw new Error(result.message || 'Failed to fetch payments');
      }
    } catch (err) {
      console.error('Error in useOwnerPayments:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // Fallback data for development
      if (import.meta.env.DEV) {
        console.log('Using fallback data for development');
        setData({
          month: month,
          summary: {
            total_apartments: 3,
            verified_count: 1,
            pending_review_count: 1,
            unpaid_count: 1,
            overdue_count: 0,
            total_expected: 15500,
            total_collected: 5000,
            building_count: 2
          },
          apartments: [
            {
              id: 1,
              apartment_number: "101",
              floor: "1",
              rent_amount: 5000,
              renter_id: 1,
              renter_name: "John Doe",
              renter_email: "john@example.com",
              renter_phone: "01712345678",
              payment_id: 1,
              amount: 5000,
              payment_status: "paid",
              paid_at: new Date().toISOString(),
              payment_method: "bkash",
              transaction_id: "TRX123",
              confirmation_status: "verified",
              verified_at: new Date().toISOString(),
              display_status: "verified",
              building_id: 1,
              building_name: "Green Valley"
            },
            {
              id: 2,
              apartment_number: "102",
              floor: "1",
              rent_amount: 5500,
              renter_id: 2,
              renter_name: "Sarah Smith",
              renter_email: "sarah@example.com",
              renter_phone: "01787654321",
              payment_id: 2,
              amount: 5500,
              payment_status: "paid",
              paid_at: new Date().toISOString(),
              payment_method: "cash",
              transaction_id: "CASH001",
              confirmation_status: "pending_review",
              verified_at: null,
              display_status: "pending_verification",
              building_id: 1,
              building_name: "Green Valley"
            },
            {
              id: 3,
              apartment_number: "201",
              floor: "2",
              rent_amount: 5000,
              renter_id: 3,
              renter_name: "Mike Johnson",
              renter_email: "mike@example.com",
              renter_phone: "01755555555",
              payment_id: null,
              amount: null,
              payment_status: null,
              paid_at: null,
              payment_method: null,
              transaction_id: null,
              confirmation_status: null,
              verified_at: null,
              display_status: "pending",
              building_id: 2,
              building_name: "Sky Tower"
            }
          ],
          buildings: {
            count: 2,
            list: ["Green Valley", "Sky Tower"]
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [month]);

  return { data, isLoading, error, refetch: fetchPayments };
};