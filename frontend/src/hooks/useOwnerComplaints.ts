import { useEffect, useState } from 'react';

export interface OwnerComplaint {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: 'pending' | 'in-progress' | 'resolved';
  apartment: string;
  renterName: string;
  createdAt: string;
  resolvedAt: string | null;
}

export const useOwnerComplaints = () => {
  const [data, setData] = useState<{ data: OwnerComplaint[] }>({ data: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5000/api/owner/complaints', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle different response formats
      if (result.success !== undefined) {
        setData({
          data: Array.isArray(result.data) ? result.data : result.data?.complaints || []
        });
      } else if (Array.isArray(result)) {
        setData({ data: result });
      } else {
        setData({ data: [] });
      }
      
    } catch (err: any) {
      console.error('Error fetching complaints:', err);
      setIsError(true);
      setError(err);
      
      // Fallback to mock data for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock complaints data');
        setData({
          data: [
            {
              id: 1,
              title: "Leaky faucet",
              description: "Kitchen faucet is dripping continuously",
              category: "plumbing",
              priority: "medium",
              status: "pending",
              renterName: "John Doe",
              apartment: "101",
              createdAt: "2025-01-20T10:30:00Z",
              resolvedAt: null
            },
            {
              id: 2,
              title: "Broken living room light",
              description: "Ceiling light not working",
              category: "electric",
              priority: "high",
              status: "in-progress",
              renterName: "Sarah Smith",
              apartment: "102",
              createdAt: "2025-01-18T14:20:00Z",
              resolvedAt: null
            },
            {
              id: 3,
              title: "Heater not working",
              description: "Central heater not turning on",
              category: "electric",
              priority: "high",
              status: "resolved",
              renterName: "Emily Wilson",
              apartment: "302",
              createdAt: "2024-12-28T09:15:00Z",
              resolvedAt: "2025-01-05T16:30:00Z"
            }
          ]
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const refetch = () => {
    fetchComplaints();
  };

  return {
    data,
    isLoading,
    isError,
    error,
    refetch
  };
};