export interface OwnerRequest {
  id: number;
  renter_name: string;
  apartment: string;
  subject: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}