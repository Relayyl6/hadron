import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../shared/utils/axiosInstance';

// fetch seller data from API
const fetchUserData = async () => {
  const response = await axiosInstance.get(
    '/api/users/auth/get_logged_in_user',
  );

  return response.data.user;
};

const useSellerState = () => {
  const {
    data: seller,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUserData,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  return { seller, isLoading, isError, refetch };
};

export default useSellerState;
