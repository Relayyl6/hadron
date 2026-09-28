import { apiRequest } from '@/utils/fetch';
// import removed

// Helper to grab token locally inside the utility file
const getCsrfToken = () => {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; x-csrf-token=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
};

// 1. POST /api/users/auth/login-user
export async function loginRequest(
  email: string,
  password: string,
): Promise<any> {
  const data = await apiRequest<BackendLoginResponse>(
    '/api/users/auth/login-user',
    {
      method: 'POST',
      body: { email, password },
      headers: {
        
      },
    },
  );
  return data.user;
}

// 2. POST /api/users/auth/forget-password
export async function sendResetTokenRequest(
  email: string,
): Promise<GenericStatusResponse> {
  return await apiRequest<GenericStatusResponse>(
    '/api/users/auth/forget-password',
    {
      method: 'POST',
      body: { email },
      headers: {
        
      },
    },
  );
}

// 3. POST /api/users/auth/verify-password-otp
export async function verifyTokenRequest(
  email: string,
  otp: string,
): Promise<GenericStatusResponse> {
  return await apiRequest<GenericStatusResponse>(
    '/api/users/auth/verify-password-otp',
    {
      method: 'POST',
      body: { email, otp },
      headers: {
        
      },
    },
  );
}

// 4. POST /api/users/auth/reset-password
export async function resetPasswordRequest(
  email: string,
  newPassword: string,
): Promise<GenericStatusResponse> {
  return await apiRequest<GenericStatusResponse>(
    '/api/users/auth/reset-password',
    {
      method: 'POST',
      body: { email, newPassword },
      headers: {
        
      },
    },
  );
}
