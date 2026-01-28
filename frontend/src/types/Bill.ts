export interface Bill {
  id: number;
  manager_id: number;
  title: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: "paid" | "pending" | "late" | "upcoming";
}
