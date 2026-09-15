import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/utils/fetch';

export function useCategories() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Fetching directly through your API pattern
      return await apiRequest<{ categories: any[]; subCategories: any[] }>(
        '/api/products/product/get-categories',
      );
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const categories = data?.categories || [];
  const subCategories = data?.subCategories || [];

  return { categories, subCategories, isLoading, isError };
}
