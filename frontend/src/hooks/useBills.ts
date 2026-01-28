import { useEffect, useState } from "react";
import { ownerApi } from "../api";

export function useBills(category: string) {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBills = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Loading bills with category:', category);
        
        // Use ownerApi instead of fetchBills
        const response = await ownerApi.getBills(category);
        
        // Handle response format
        const data = response.data?.success ? response.data.data : response.data;
        
        console.log('📊 Bills loaded:', data?.length || 0, 'items');
        setBills(Array.isArray(data) ? data : []);
        
      } catch (err: any) {
        console.error('❌ Error loading bills:', err);
        setError(err.message || 'Failed to load bills');
        setBills([]);
      } finally {
        setLoading(false);
      }
    };

    loadBills();
  }, [category]);

  return { bills, loading, error };
}