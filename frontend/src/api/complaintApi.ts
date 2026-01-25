// src/api/ownerApi.ts
export interface OwnerComplaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  apartment: string;
  renterName: string;
  createdAt: string;
  resolvedAt: string | null;
  status: 'pending' | 'in-progress' | 'resolved';
}

export interface OwnerComplaintsResponse {
  success: boolean;
  data: OwnerComplaint[];
  message?: string;
}

export const getOwnerComplaints = async (): Promise<OwnerComplaintsResponse> => {
  const token = localStorage.getItem('token');
  
  const res = await fetch('http://localhost:5000/api/owner/complaints', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch complaints: ${text}`);
  }

  return res.json();
};