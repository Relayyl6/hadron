'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CreateShop from '@/components/create-shop';
import { useUser } from '@/context/user-context';
import { toast } from 'react-toastify';

function CreateShopContent() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center text-[#80deea]">
        Loading...
      </div>
    );
  }

  if (!user || !user.sellerProfile?.id) {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Seller Profile Required</h1>
        <p className="text-gray-400">You must be logged in as a seller to create a shop.</p>
        <button 
          onClick={() => router.push('/log-in')}
          className="mt-6 px-6 py-2 bg-[#80deea] text-black font-semibold rounded-lg hover:bg-[#80deea]/80 transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Setup Your Shop</h1>
          <p className="text-gray-400">Enter your business details to complete your storefront.</p>
        </div>
        
        <div className="bg-[#18181b] rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-800/50">
          <CreateShop 
            sellerId={user.sellerProfile.id} 
            setActiveStep={() => {
              toast.success("Shop created successfully!");
              router.push(returnUrl);
            }} 
          />
        </div>
      </div>
    </div>
  );
}

export default function CreateShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111] flex items-center justify-center text-[#80deea]">Loading...</div>}>
      <CreateShopContent />
    </Suspense>
  );
}
