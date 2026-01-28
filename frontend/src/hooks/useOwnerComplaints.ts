// src/hooks/useOwnerComplaints.ts
import { useQuery } from '@tanstack/react-query';
import { getOwnerComplaints, type OwnerComplaintsResponse } from '../api/complaintApi';

export const useOwnerComplaints = () => {
  return useQuery<OwnerComplaintsResponse, Error>({
    queryKey: ['ownerComplaints'],
    queryFn: getOwnerComplaints,
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    retry: 1,                 // retry once on failure
  });
};