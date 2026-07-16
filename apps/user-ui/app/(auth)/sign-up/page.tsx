'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation } from '@tanstack/react-query'

import { useUser } from '../../../context/user-context'
import { apiRequest } from '@/shared/utils/fetch'

import { FaGoogle, FaApple } from 'react-icons/fa'

import { 
  registrationSchema
} from '@/shared/utils/lib'
import { parseAddressString } from '@/shared/utils/addressParser'

type Role = 'CUSTOMER' | 'SELLER'

type SignUpFormValues = z.infer<typeof registrationSchema>

export default function SignupPage() {
  const { refetch } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('from') ?? '/'

  // Workflow tracking
  const [step, setStep] = useState<number>(0)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [globalError, setGlobalError] = useState('')

  const [resendCountdown, setResendCountdown] = useState(0); // 0-second at the beginning, updates to 30 when reched the 4th step screen
  const canResend = resendCountdown === 0;

  useEffect(() => {
    if (resendCountdown === 0) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. UNIFIED FORM SETUP (REACT HOOK FORM)
  // ─────────────────────────────────────────────────────────────────────────────
  const { register, handleSubmit, watch, setValue, trigger, getValues, formState: { errors } } = useForm<SignUpFormValues>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
    defaultValues: {
      role: 'CUSTOMER',
      name: '',
      email: '',
      password: '',
      phoneNumber: '',
      address: '',
      gender: 'UNSPECIFIED',
      businessName: '',
      businessType: 'INDIVIDUAL',
      taxId: '',
      marketingConsent: false,
      pushNotifications: false,
    }
  })

  const selectedRole = watch('role')
  const userEmail = watch('email')

  // Step Navigators matching field checks before track transitions
  const handleNextStep = async (fieldsToValidate: (keyof SignUpFormValues)[]) => {
    setGlobalError('')
    const isStepValid = await trigger(fieldsToValidate)
    if (isStepValid) {
      setStep((prev) => prev + 1)
    }
  }

  const handlePrevStep = () => {
    setGlobalError('')
    if (step === 4 && selectedRole === 'SELLER') {
      setStep(2)
    } else {
      setStep((prev) => Math.max(0, prev - 1))
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. MUTATION OPERATIONS (TANSTACK QUERY)
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Phase 1: Post Payload Configuration down to Redis / dispatch execution
  const initiateRegistrationMutation = useMutation({
    mutationFn: async (values: SignUpFormValues) => {
      const formattedAddress = parseAddressString(values.address);
      const payload = {
        role: values.role,
        account: {
          name: values.name,
          email: values.email,
          password: values.password
        },
        ...(values.role === 'SELLER'
          ? {
              sellerProfile: {
                businessName: values.businessName,
                businessType: values.businessType,
                taxId: values.businessType === 'REGISTERED_COMPANY' ? values.taxId : undefined,
              },
            }
          : {
              customerProfile: {
                phoneNumber: values.phoneNumber,
                address: formattedAddress,
                gender: values.gender,
                preferences: { 
                  currency: 'USD', 
                  language: 'en',
                  marketingConsent: values.marketingConsent,
                  pushNotifications: values.pushNotifications
                },
              },
            }),
      }
      return apiRequest<{
        success: boolean;
        message: string
      }>('/api/users/auth/user-registration', {
        method: 'POST',
        body: payload,
      })
    },
    onSuccess: (res) => {
      setSuccessMsg(res.message || 'OTP sent to email.')
      setStep(4)
      setResendCountdown(30)
    },
    onError: (err: any) => {
      setGlobalError(err.message || 'Registration initialization failed. Check your data inputs.')
    }
  })

  // Phase 2: Complete Code confirmation to absolute DB state write
  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{
        success: boolean
        data: { id: string; email: string; role: string; name: string; avatarUrl?: string }
      }>('/api/users/auth/verify-registration', {
        method: 'POST',
        body: { email: userEmail, otp },
      })
    },
    onSuccess: () => {
      setTimeout(async () => {
        await refetch()
        router.push(returnTo)
      }, 1500)
    },
    onError: (err: any) => {
      setOtpError(err.message || 'Invalid activation code entry. Try again.')
    }
  })

  const handleResendOtp = () => {
    if (!canResend || initiateRegistrationMutation.isPending) return

    // Grabs the fresh, current state of all fields across your multi-step form
    const currentFormValues = getValues()

    initiateRegistrationMutation.mutate(currentFormValues, {
      onSuccess: (res) => {
        setSuccessMsg(res.message || 'A fresh code has been sent.')
        setResendCountdown(30) // Reset countdown only on a true successful dispatch
      },
      onError: (err: any) => {
        setOtpError(err.message || 'Failed to resend activation code. Please try again.')
      }
    })
  }

  return (
    <main className='flex h-[calc(100vh-68px)] w-full overflow-hidden items-center justify-center bg-gray-50 px-4'>
      <div className='w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300'>
        
        {/* Animated Slide Viewport Window Wrapper */}
        <div 
          className='flex transition-transform duration-500 ease-out will-change-transform'
          style={{ transform: `translateX(-${step * 100}%)` }}
        >
          
          {/* STEP 0: Role Selection */}
          <div className='w-full flex-shrink-0 p-8'>
            <h1 className='mb-1 text-xl font-semibold text-gray-900'>Join Hadron</h1>
            <p className='mb-6 text-sm text-gray-500'>Choose how you plan to use our platform application.</p>
            
            <div className='flex flex-col gap-5'>
              <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium text-gray-700' htmlFor='role'>
                  Register account as a:
                </label>
                <select
                  id='role'
                  {...register('role')}
                  className='w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
                >
                  <option value='CUSTOMER'>Customer (Discover & Buy Items)</option>
                  <option value='SELLER'>Merchant Seller (List & Manage Products)</option>
                </select>
              </div>
              
              <button
                type='button'
                onClick={() => handleNextStep(['role'])}
                className='mt-2 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85'
              >
                Continue
              </button>
            </div>
          </div>

          {/* STEP 1: Core Credentials */}
          <div className='w-full flex-shrink-0 p-8'>
            <h1 className='mb-1 text-xl font-semibold text-gray-900'>Account Details</h1>
            <p className='mb-6 text-sm text-gray-500'>Provide basic log-in profile parameters</p>
            
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-gray-700' htmlFor='name'>Full name</label>
                <input
                  id='name'
                  type='text'
                  {...register('name')}
                  placeholder='Yemuel Oseghale'
                  className='rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
                />
                {errors.name && <p className='text-xs text-red-500'>{errors.name.message}</p>}
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-gray-700' htmlFor='email'>Email</label>
                <input
                  id='email'
                  type='email'
                  {...register('email')}
                  placeholder='you@example.com'
                  className='rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
                />
                {errors.email && <p className='text-xs text-red-500'>{errors.email.message}</p>}
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-gray-700' htmlFor='password'>Password</label>
                <input
                  id='password'
                  type='password'
                  {...register('password')}
                  placeholder='••••••••'
                  className='rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
                />
                {errors.password && <p className='text-xs text-red-500'>{errors.password.message}</p>}
              </div>

              <div className='flex gap-3 mt-2'>
                <button
                  type='button'
                  onClick={handlePrevStep}
                  className='flex-1 rounded-md border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50'
                >
                  Back
                </button>
                <button
                  type='button'
                  onClick={() => handleNextStep(['name', 'email', 'password'])}
                  className='flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85'
                >
                  Continue
                </button>
              </div>
            </div>
          </div>

          {/* STEP 2: Conditional Profile Details */}
          <div className='w-full flex-shrink-0 p-8'>
            <h1 className='mb-1 text-xl font-semibold text-gray-900'>
              {selectedRole === 'SELLER' ? 'Business Profile' : 'Profile Settings'}
            </h1>
            <p className='mb-6 text-sm text-gray-500'>Complete context profiles to customize experience</p>
            
            {selectedRole === 'CUSTOMER' ? (
              <div className='flex flex-col gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium text-gray-700' htmlFor='phone'>Phone Number</label>
                  <input
                    id='phone'
                    type='tel'
                    {...register('phoneNumber')}
                    placeholder='+234...'
                    className='rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
                  />
                  {errors.phoneNumber && <p className='text-xs text-red-500'>{errors.phoneNumber.message}</p>}
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium text-gray-700' htmlFor='address'>Physical Address</label>
                  <input
                    id='address'
                    type='text'
                    {...register('address')}
                    placeholder='e.g. No. 50 Buvale Boulevard, Wuse, Abuja-FCT, Nigeria, 901101'
                    className='rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
                  />
                  {errors.address && <p className='text-xs text-red-500'>{errors.address.message}</p>}
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium text-gray-700' htmlFor='gender'>Gender</label>
                  <select
                    id='gender'
                    {...register('gender')}
                    className='rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
                  >
                    <option value='UNSPECIFIED'>Prefer not to say</option>
                    <option value='MALE'>Male</option>
                    <option value='FEMALE'>Female</option>
                    <option value='OTHER'>Other</option>
                  </select>
                </div>

                <div className='flex gap-3 mt-2'>
                  <button
                    type='button'
                    onClick={handlePrevStep}
                    className='flex-1 rounded-md border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50'
                  >
                    Back
                  </button>
                  <button
                    type='button'
                    onClick={() => handleNextStep(['phoneNumber', 'address', 'gender'])}
                    className='flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85'
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit((vals: SignUpFormValues) => initiateRegistrationMutation.mutate(vals))} className='flex flex-col gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium text-gray-700' htmlFor='bizName'>Business Name</label>
                  <input
                    id='bizName'
                    type='text'
                    {...register('businessName')}
                    placeholder='Hadron Merchant LLC'
                    className='rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
                  />
                  {errors.businessName && <p className='text-xs text-red-500'>{errors.businessName.message}</p>}
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium text-gray-700' htmlFor='bizType'>Company Structure</label>
                  <select
                    id='bizType'
                    {...register('businessType')}
                    className='rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
                  >
                    <option value='INDIVIDUAL'>Sole Proprietor / Individual</option>
                    <option value='REGISTERED_COMPANY'>Registered Corporate entity</option>
                  </select>
                </div>
                {watch('businessType') === 'REGISTERED_COMPANY' && (
                  <div className='flex flex-col gap-1.5 animate-fadeIn'>
                    <label className='text-sm font-medium text-gray-700' htmlFor='taxId'>Tax ID (TIN)</label>
                    <input
                      id='taxId'
                      type='text'
                      {...register('taxId')}
                      placeholder='12345678-0001'
                      className='rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
                    />
                    {errors.taxId && <p className='text-xs text-red-500'>{errors.taxId.message}</p>}
                  </div>
                )}

                {globalError && <p className='text-xs text-red-500 mt-1'>{globalError}</p>}

                <div className='flex gap-3 mt-2'>
                  <button
                    type='button'
                    onClick={handlePrevStep}
                    disabled={initiateRegistrationMutation.isPending}
                    className='flex-1 rounded-md border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50'
                  >
                    Back
                  </button>
                  <button
                    type='submit'
                    disabled={initiateRegistrationMutation.isPending}
                    className='flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50'
                  >
                    {initiateRegistrationMutation.isPending ? 'Processing...' : 'Send OTP Mail'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* STEP 3: Dedicated Customer Preferences Screen */}
          <div className='w-full flex-shrink-0 p-8'>
            <h1 className='mb-1 text-xl font-semibold text-gray-900'>Preferences</h1>
            <p className='mb-6 text-sm text-gray-500'>Fine-tune how you stay up to date with updates.</p>

            <form onSubmit={handleSubmit((vals: SignUpFormValues) => initiateRegistrationMutation.mutate(vals))} className='flex flex-col gap-4'>
              <div className='flex flex-col gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5'>
                {/* Switch 1: Push Notifications */}
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col gap-0.5 pr-4'>
                    <label htmlFor='push-toggle' className='text-sm font-medium text-gray-800 cursor-pointer'>Push Notifications</label>
                    <p className='text-xs text-gray-400'>Get instant updates on your orders and account alerts.</p>
                  </div>
                  <button
                    id='push-toggle'
                    type='button'
                    onClick={() => setValue('pushNotifications', !watch('pushNotifications'))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      watch('pushNotifications') ? 'bg-gray-900' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        watch('pushNotifications') ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch 2: Marketing Consent */}
                <div className='flex items-center justify-between border-t border-gray-100 pt-3'>
                  <div className='flex flex-col gap-0.5 pr-4'>
                    <label htmlFor='marketing-toggle' className='text-sm font-medium text-gray-800 cursor-pointer'>Marketing Updates</label>
                    <p className='text-xs text-gray-400'>Receive emails about exclusive merchant drops and deals.</p>
                  </div>
                  <button
                    id='marketing-toggle'
                    type='button'
                    onClick={() => setValue('marketingConsent', !watch('marketingConsent'))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                      watch('marketingConsent') ? 'bg-gray-900' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        watch('marketingConsent') ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {globalError && <p className='text-xs text-red-500 mt-1'>{globalError}</p>}

              <div className='flex gap-3 mt-2'>
                <button
                  type='button'
                  onClick={handlePrevStep}
                  disabled={initiateRegistrationMutation.isPending}
                  className='flex-1 rounded-md border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50'
                >
                  Back
                </button>
                <button
                  type='submit'
                  disabled={initiateRegistrationMutation.isPending}
                  className='flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50'
                >
                  {initiateRegistrationMutation.isPending ? 'Processing...' : 'Send OTP Mail'}
                </button>
              </div>
            </form>
          </div>

          {/* STEP 4: OTP Verification Screen */}
          <div className='w-full flex-shrink-0 p-8 flex flex-col justify-center min-h-[380px]'>
            {verifyOtpMutation.isSuccess ? (
              <div className='flex flex-col items-center justify-center py-6 text-center animate-scaleUp'>
                <div className='relative flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500 mb-4 border border-green-200'>
                  <svg 
                    className='h-8 w-8 stroke-current transition-all duration-1000 [stroke-dasharray:100] [stroke-dashoffset:100] animate-[dash_1s_ease-in-out_forwards]' 
                    fill='none' 
                    viewBox='0 0 24 24' 
                    strokeWidth='3'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                  </svg>
                </div>
                <h2 className='text-lg font-semibold text-gray-900'>Account Verified!</h2>
                <p className='text-sm text-gray-500 mt-1'>Syncing details and initializing workspace session...</p>
              </div>
            ) : (
              <>
                <h1 className='mb-1 text-xl font-semibold text-gray-900'>Verify your Email</h1>
                
                {successMsg && (
                  <div className='mb-5 rounded-lg bg-blue-50/70 border border-blue-100 p-3 text-xs text-blue-700 leading-relaxed'>
                    {successMsg}
                  </div>
                )}
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (otp.length === 4) verifyOtpMutation.mutate();
                  }} 
                  className='flex flex-col gap-5'
                >
                  <div className='flex flex-col gap-2'>
                    <label className='text-sm font-medium text-gray-700 text-center md:text-left'>
                      Enter Verification Code
                    </label>
                    
                    <div className='flex justify-center gap-3'>
                      {[0, 1, 2, 3].map((index) => (
                        <input
                          key={index}
                          type='text'
                          maxLength={1}
                          inputMode='numeric'
                          pattern='[0-9]*'
                          value={otp[index] || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            const currentOtpArr = otp.split('');
                            currentOtpArr[index] = val;
                            const newOtpValue = currentOtpArr.join('');
                            setOtp(newOtpValue);
                            setOtpError('');

                            if (val && e.target.nextElementSibling) {
                              (e.target.nextElementSibling as HTMLInputElement).focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !otp[index] && (e.target as HTMLInputElement).previousElementSibling) {
                              ((e.target as HTMLInputElement).previousElementSibling as HTMLInputElement).focus();
                            }
                          }}
                          className='w-12 h-12 text-center text-xl font-bold font-mono rounded-lg border border-gray-200 bg-white shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                        />
                      ))}
                    </div>
                  </div>

                  {otpError && <p className='text-xs text-red-500 mt-1 text-center'>{otpError}</p>}

                  <button
                    type='submit'
                    disabled={verifyOtpMutation.isPending || otp.length < 4}
                    className='mt-2 rounded-md bg-gray-900 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50'
                  >
                    {verifyOtpMutation.isPending ? 'Verifying...' : 'Complete Registration'}
                  </button>

                  {/* RESEND OTP BUTTON */}
                  <div className='text-center mt-1'>
                    <button
                      type='button'
                      disabled={!canResend || verifyOtpMutation.isPending || initiateRegistrationMutation.isPending}
                      onClick={handleResendOtp}
                      className='text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:no-underline transition-colors underline underline-offset-4'
                    >
                      {initiateRegistrationMutation.isPending 
                        ? 'Sending code...' 
                        : canResend 
                          ? 'Resend Code' 
                          : `Resend Code in ${resendCountdown}s`
                      }
                    </button>
                  </div>
                  
                  <button
                    type='button'
                    onClick={handlePrevStep}
                    disabled={verifyOtpMutation.isPending}
                    className='text-center text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1 underline underline-offset-4'
                  >
                    Back to edit profile info
                  </button>
                </form>
              </>
            )}
          </div>

        </div>

        {/* Global Footer Navigation Links Context */}
        {step < 4 && (
          <>
            <div className='w-full overflow-hidden items-center justify-center bg-gray-50 px-4'>
              <div className='flex items-center justify-center gap-3'>
                <div className='h-[1px] flex-1 bg-gray-200' />
                <span className='text-[10px] font-semibold uppercase tracking-wider text-gray-400 select-none'>Or continue with</span>
                <div className='h-[1px] flex-1 bg-gray-200' />
              </div>
              
              <div className='mt-4 grid grid-cols-2 gap-3'>
                <button
                  type='button'
                  onClick={() => alert('OAuth flow integration placeholder')}
                  className='flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50'
                >
                  <FaGoogle className='h-3.5 w-3.5 text-red-500' />
                  <span>Google</span>
                </button>
                <button
                  type='button'
                  onClick={() => alert('OAuth flow integration placeholder')}
                  className='flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50'
                >
                  <FaApple className='h-3.5 w-3.5 text-gray-900' />
                  <span>Apple</span>
                </button>
              </div>
            </div>
            <div className='border-t border-gray-100 bg-gray-50/50 px-8 py-4 text-center'>
              
              <p className='text-xs text-gray-400'>
                Already have an account?{' '}
                <Link
                  href={`/log-in?from=${returnTo}`}
                  className='text-gray-700 font-medium underline underline-offset-2 hover:text-gray-900'
                >
                  Sign in
                </Link>
              </p>
            </div>
          </>
        )}

      </div>
    </main>
  )
}