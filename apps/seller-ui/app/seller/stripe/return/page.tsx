'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/context/user-context'
import { apiRequest } from '@/utils/fetch'

export default function StripeReturnPage() {
  const router = useRouter()
  const { refetch } = useUser()
  const [status, setStatus] = useState('Securely syncing your payout details with Stripe...')

  useEffect(() => {
    const verifyWithBackend = async () => {
      try {
        setStatus('Verifying your account status with Stripe...')
        
        // 1. Force the backend to actively check Stripe and update the DB
        await apiRequest('/api/users/payment/seller/stripe/verify-status', { method: 'GET' })
        
        setStatus('Updating your dashboard...')
        
        // 2. Refetch the user context so your frontend state matches the newly updated DB
        await refetch()
      } catch (error) {
        console.error("Error verifying Stripe status", error)
        // Even if it fails, the webhook might catch it later.
      } finally {
        // 3. Send them back to the dashboard. The banner will now be gone!
        router.push('/') 
      }
    }

    verifyWithBackend()
  }, [refetch, router])

  return (
    <div className='flex h-screen w-full flex-col items-center justify-center bg-gray-50 px-4'>
      <div className='flex flex-col items-center animate-pulse'>
        <div className='h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4'></div>
        <h1 className='text-xl font-semibold text-gray-900'>Verifying Connection</h1>
        <p className='mt-2 text-sm text-gray-500'>{status}</p>
      </div>
    </div>
  )
}