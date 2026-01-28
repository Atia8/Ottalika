import { useEffect, useState } from "react";
import { fetchBills } from "../api/bills.api";
import { type Bill } from "../types/Bill";

export function useBills(category: string) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetchBills(category)
      .then(setBills)
      .finally(() => setLoading(false));
  }, [category]);
  

  return { bills, loading };
}
