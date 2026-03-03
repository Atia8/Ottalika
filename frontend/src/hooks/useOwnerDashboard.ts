// import { useEffect, useState } from "react";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// export const useOwnerDashboard = (month: string) => {

//   const [data, setData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   const fetchData = async () => {

//     try {
//       const token = localStorage.getItem("token");

//       const res = await fetch(
//         `${API_URL}/owner/dashboard?month=${month}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         }
//       );

//       const result = await res.json();

//       if (result.success) {
//         setData(result.data);
//       }

//     } catch (err) {
//       console.error(err);
//     }

//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchData();
//   }, [month]);

//   return { data, loading };
// };

import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const useOwnerDashboard = (month: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      
      console.log("🔍 Hook - Fetching with month:", month);
      console.log("🔍 Hook - Token exists:", !!token);
      
      if (!token) {
        throw new Error("No authentication token found");
      }

      const url = `${API_URL}/owner/dashboard?month=${month}`;
      console.log("🔍 Hook - Full URL:", url);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      console.log("🔍 Hook - Response status:", res.status);
      
      const result = await res.json();
      console.log("🔍 Hook - Raw response:", result);

      if (result.success) {
        console.log("🔍 Hook - Data received:", result.data);
        setData(result.data);
      } else {
        console.error("🔍 Hook - API returned error:", result);
        setError(result.message || "API returned unsuccessful response");
      }
    } catch (err) {
      console.error("🔍 Hook - Fetch error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month]);

  return { data, loading, error };
};