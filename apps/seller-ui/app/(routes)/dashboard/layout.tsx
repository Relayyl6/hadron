import React from 'react';
import SideBarWrapper from '@/components/sidebar/SideBarWrapper';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;

  // If no tokens exist, redirect to login
  if (!accessToken && !refreshToken) {
    redirect('/log-in');
  }
  return (
    <div className="h-screen flex bg-black overflow-hidden">
      {/* Sidebar Container with vertical scroll enabled */}
      <div className="w-[280px] min-w-[250px] max-w-[300px] border-r border-slate-800 text-white flex flex-col h-full">
        <SideBarWrapper />
      </div>

      {/* Main content area */}
      <main className="flex-1 h-full overflow-y-auto bg-black text-white">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
