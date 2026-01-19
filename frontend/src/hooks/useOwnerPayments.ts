// src/hooks/useOwnerPayments.ts
import { useQuery } from '@tanstack/react-query';
import { getOwnerPayments, type OwnerPaymentsResponse } from '../api/ownerApi';

export const useOwnerPayments = (monthDate: string) => {
  return useQuery<OwnerPaymentsResponse, Error>({
    queryKey: ['ownerPayments', monthDate],
    queryFn: () => getOwnerPayments(monthDate),
    staleTime: 5 * 60 * 1000, // cache 5 minutes
    retry: 1,                 // retry once on failure
  });
};
