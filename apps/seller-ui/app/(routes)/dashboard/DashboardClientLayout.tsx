'use client';

import React, { useState } from 'react';
import SideBarWrapper from '@/components/sidebar/SideBarWrapper';
import { Menu, X } from 'lucide-react';

export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-black overflow-hidden relative">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-black text-white z-40">
        <span className="font-semibold text-lg">Seller Workspace</span>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 -mr-2 text-gray-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-[70]
        w-[280px] min-w-[250px] max-w-[300px] 
        border-r border-slate-800 text-white flex flex-col h-full bg-black
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <SideBarWrapper />
      </div>

      {/* Main content area */}
      <main className="flex-1 h-full overflow-y-auto bg-black text-white">
        {children}
      </main>
    </div>
  );
}
