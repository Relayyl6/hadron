import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClientLayout from './DashboardClientLayout';

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;

  // If no tokens exist, redirect to login
  if (!accessToken && !refreshToken) {
    redirect('/log-in');
  }
  
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
};

export default DashboardLayout;
