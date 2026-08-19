'use client'

import React from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '@/utils/fetch'
import { useUser } from '@/context/user-context' // Adjust path if needed
import { FaExclamationTriangle } from 'react-icons/fa'

export default function DashboardPage() {
  // 1. Fetch user context to check their current Stripe status
  const { user } = useUser()
  
  // Assuming your user object contains the sellerProfile data
  const isStripeEnabled = user?.sellerProfile?.stripePayoutsEnabled || false

  // 2. Setup the mutation to request the onboarding link
  const stripeOnboardingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ success: boolean; url: string }>(
        '/api/users/payment/seller/stripe/onboarding-link',
        { method: 'POST' }
      )
    },
    onSuccess: (res) => {
      // 4. The Redirect (Frontend -> Stripe)
      // Once the backend generates the unique link, we push the user to Stripe's website
      if (res.url) {
        window.location.href = res.url
      }
    },
    onError: (err: any) => {
      console.error("Failed to generate Stripe link:", err)
      alert(err.message || "Failed to connect to Stripe. Please try again.")
    }
  })

  return (
    <div className='p-6 md:p-10 max-w-7xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900'>Seller Dashboard</h1>
        <p className='text-sm text-gray-500'>Manage your shop, products, and earnings.</p>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          THE STRIPE ONBOARDING BANNER 
          Only renders if the user has not completed Stripe setup yet.
      ────────────────────────────────────────────────────────────────────────────── */}
      {!isStripeEnabled && (
        <div className='mb-8 flex flex-col items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:flex-row sm:items-center'>
          <div className='flex items-start gap-3 sm:items-center'>
            <div className='mt-0.5 rounded-full bg-amber-100 p-2 text-amber-600 sm:mt-0'>
              <FaExclamationTriangle className='h-5 w-5' />
            </div>
            <div>
              <h3 className='font-semibold text-amber-900'>
                Action Required: Connect your bank account
              </h3>
              <p className='mt-1 text-sm text-amber-700 leading-relaxed'>
                You must complete your payout setup to start receiving funds and listing products in your shop.
              </p>
            </div>
          </div>
          
          <button
            type='button'
            onClick={() => stripeOnboardingMutation.mutate()}
            disabled={stripeOnboardingMutation.isPending}
            className='whitespace-nowrap rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {stripeOnboardingMutation.isPending ? 'Connecting to Stripe...' : 'Set up Payouts'}
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          DASHBOARD CONTENT (LOCKED OR UNLOCKED)
      ────────────────────────────────────────────────────────────────────────────── */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className={`flex h-48 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 transition-opacity ${!isStripeEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <h4 className='text-sm font-medium text-gray-500'>Total Earnings</h4>
          <p className='text-3xl font-bold text-gray-900 mt-2'>$0.00</p>
        </div>
        
        <div className={`flex h-48 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 transition-opacity ${!isStripeEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <h4 className='text-sm font-medium text-gray-500'>Active Products</h4>
          <p className='text-3xl font-bold text-gray-900 mt-2'>0</p>
        </div>
        
        <div className={`flex h-48 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 transition-opacity ${!isStripeEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <button className='rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white'>
            + Add New Product
          </button>
        </div>
      </div>
      
    </div>
  )
}