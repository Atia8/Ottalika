import { api } from "./axios";
import { type Bill } from "../types/Bill";

export const fetchBills = async (category= 'pending'): Promise<Bill[]> => {
  const res = await api.get(`/bills?category=${category}`);
  
  return res.data;
};


// Fetch expense summary
export const fetchExpenseSummary = async (): Promise<{ total: number; paid: number; pending: number }> => {
  const res = await api.get(`/bills/expenses/summary`);
  return res.data;
};


