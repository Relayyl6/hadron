import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/utils/fetch';

export function useDiscount() {
    // 1. Fetch Discounts
    const { data, isLoading, isError } = useQuery({
        queryKey: ["shop-discounts"],
        queryFn: async () => {
            return await apiRequest<{ success: boolean; discount_codes: any[] }>(
                '/api/products/product/get-discount-codes',
            ); 
        },
        staleTime: 1000 * 60 * 5,
        retry: 2,
    })

    const discountCodes = data?.discount_codes || [];

    return {discountCodes, isLoading, isError}
}