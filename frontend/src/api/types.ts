// export interface PaymentSummary {
//   total_apartments: number;
//   verified_count: number;
//   pending_review_count: number;
//   unpaid_count: number;
//   overdue_count: number;
//   total_expected: number;
//   total_collected: number;
//   collection_percentage: number;
// }

// export interface ApartmentPayment {
//   id: number;
//   apartment_number: string;
//   floor: number;
//   rent_amount: number;
//   renter_id: number;
//   renter_name: string;
//   renter_email: string;
//   renter_phone: string;
//   payment_id: number | null;
//   payment_status: 'pending' | 'paid' | 'overdue' | 'confirmed' | null;
//   paid_at: string | null;
//   payment_method: string | null;
//   transaction_id: string | null;
//   confirmation_status: 'pending_review' | 'verified' | 'rejected' | 'disputed' | null;
//   verified_at: string | null;
//   display_status: 'verified' | 'pending_review' | 'overdue' | 'unpaid';
// }

// export interface MonthOption {
//   display_month: string;
//   value: string; // YYYY-MM-DD format
// }

// export interface OwnerPaymentsResponse {
//   success: boolean;
//   month: string;
//   summary: PaymentSummary;
//   apartments: ApartmentPayment[];
// }