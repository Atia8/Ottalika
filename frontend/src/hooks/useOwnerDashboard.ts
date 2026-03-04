import { useEffect, useState } from "react";

export function useOwnerDashboard(month: string) {

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchData = async () => {

      try {

        setLoading(true);

        const res = await fetch(
          `http://localhost:5000/api/owner/dashboard?month=${month}`
        );

        const json = await res.json();

        setData(json);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }

    };

    fetchData();

  }, [month]); 

  return { data, loading };
}