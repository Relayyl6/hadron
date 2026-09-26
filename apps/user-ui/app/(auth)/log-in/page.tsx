'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { FaGoogle, FaApple } from 'react-icons/fa' // Added for modern social row presentation

import { useUser } from '../../../context/user-context'
import { toast, Bounce } from 'react-toastify';

import { 
  loginRequest, 
  sendResetTokenRequest, 
  verifyTokenRequest, 
  resetPasswordRequest 
} from '@/shared/utils/auth-api'

import { 
  loginSchema, 
  forgotPasswordSchema, 
  passwordResetSchema, 
  LoginFormValues,
  ForgotFormValues,
  ResetFormValues
} from '@/shared/utils/lib'

export default function LoginPage() {
  const { refetch } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('from') ?? '/'

  // Flow State Monitors
  const [step, setStep] = useState<number>(0)
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [successNotice, setSuccessNotice] = useState('')
  const [globalError, setGlobalError] = useState('')

  const [resendCooldown, setResendCooldown] = useState(0)
  const [activeEmail, setActiveEmail] = useState('')

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. FORM STATE CONTROLLERS (REACT HOOK FORM)
  // ─────────────────────────────────────────────────────────────────────────────
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false }
  })

  const forgotForm = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  })

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { newPassword: '', confirmPassword: '' }
  })

  // Watch current context email from state matrices
//  const currentEmail = loginForm.watch('email') || forgotForm.watch('email')

  // Handle local storage hydration for remembered state
  useEffect(() => {
    const savedEmail = localStorage.getItem('hadron_remembered_email')
    if (savedEmail) {
      loginForm.setValue('email', savedEmail)
      loginForm.setValue('rememberMe', true)
    }
  }, [loginForm])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const navigateToStep = (targetStep: number) => {
    setGlobalError('')
    setSuccessNotice('')
    setOtpError('')
    setStep(targetStep)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. SERVER STATE OPERATORS (TANSTACK QUERY MUTATIONS)
  // ─────────────────────────────────────────────────────────────────────────────
  
  // Step 0: Login Mutation Handler
  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => loginRequest(values.email, values.password),
    onSuccess: async (userProfile, values) => {
      await refetch()
      if (values.rememberMe) {
        localStorage.setItem('hadron_remembered_email', userProfile.email)
      } else {
        localStorage.removeItem('hadron_remembered_email')
      }
      router.push(returnTo)
    },
    onError: (err: any) => {
      setGlobalError(err.message || 'Invalid email or password parameters.')
    }
  })

  // Step 1: Forgot Password Initial Dispatch Mutation
  const forgotMutation = useMutation({
    mutationFn: (values: ForgotFormValues) => sendResetTokenRequest(values.email),
    onSuccess: (res, values) => {
      setActiveEmail(values.email)
      setSuccessNotice(res.message || 'OTP reset verification mail dispatched successfully.')
      setResendCooldown(30) // ← added
      navigateToStep(2)
    },
    onError: (err: any) => {
      setGlobalError(err.message || 'Failed to dispatch password recovery initialization.')
    }
  })

  // Step 2: Manual OTP Verification Mutation
  const otpVerifyMutation = useMutation({
    mutationFn: () => verifyTokenRequest(activeEmail, otp),
    onSuccess: (res) => {
      setSuccessNotice(res.message || 'OTP verified. Please set a new password.')
      navigateToStep(3)
    },
    onError: (err: any) => {
      setOtpError(err.message || 'Invalid validation token entry code.')
    }
  })

  // Step 3: Password Update Commitment Mutation
  const resetMutation = useMutation({
    mutationFn: (values: ResetFormValues) => resetPasswordRequest(activeEmail, values.newPassword),
    onSuccess: (res) => {
      setSuccessNotice(res.message || 'Password updated successfully. Returning to Log-in...')
      toast.success('✨ Password successfully reset!', {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
      setTimeout(() => {
        loginForm.reset({ email: activeEmail, password: '', rememberMe: false })
        forgotForm.reset({ email: activeEmail })
        resetForm.reset()
        setOtp('')
        navigateToStep(0)
      }, 2000)
    },
    onError: (err: any) => {
      setGlobalError(err.message || 'Failed to modify password parameters.')
    }
  })

//  const goToForgotFlow = () => {
//    forgotForm.setValue('email', loginForm.getValues('email'))
//    navigateToStep(1)
//  }

  return (
    <main className='flex h-[calc(100vh-68px)] w-full overflow-hidden items-center justify-center bg-gray-50 px-4'>
      <div className='w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300'>
        
        {/* Hardware accelerated linear transform slide track wrapper */}
        <div 
          className='flex transition-transform duration-500 ease-out will-change-transform'
          style={{ transform: `translateX(-${step * 100}%)` }}
        >
          
          {/* STEP 0: Base Login Panel */}
          <div className='w-full flex-shrink-0 p-8'>
            <h1 className='mb-1 text-xl font-semibold text-gray-900'>Welcome back</h1>
            <p className='mb-6 text-sm text-gray-500'>Sign in to manage your Hadron workspace</p>
            
            <form onSubmit={loginForm.handleSubmit((vals) => loginMutation.mutate(vals))} className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-gray-700' htmlFor='login-email'>Email address</label>
                <input
                  id='login-email'
                  type='email'
                  {...loginForm.register('email')}
                  placeholder='you@example.com'
                  className='rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
                />
                {loginForm.formState.errors.email && (
                  <p className='text-xs text-red-500'>{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className='flex flex-col gap-1.5'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium text-gray-700' htmlFor='login-password'>Password</label>
                  <button
                    type='button'
                    onClick={() => {
                      forgotForm.setValue('email', loginForm.getValues('email'))
                      navigateToStep(1)
                    }}
                    className='text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors'
                  >
                    Forgot password?
                  </button>
                </div>
                
                <div className='relative flex items-center'>
                  <input
                    id='login-password'
                    type={showPassword ? 'text' : 'password'}
                    {...loginForm.register('password')}
                    placeholder='••••••••'
                    className='w-full rounded-md border border-gray-200 pl-3 pr-10 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
                  />
                  <button 
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none'
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2'>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18' />
                      </svg>
                    ) : (
                      <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2'>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                        <path strokeLinecap='round' strokeLinejoin='round' d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                      </svg>
                    )}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className='text-xs text-red-500'>{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className='flex items-center -mt-1'>
                <input
                  id='remember-me'
                  type='checkbox'
                  {...loginForm.register('rememberMe')}
                  className='h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-950 accent-gray-900 cursor-pointer'
                />
                <label htmlFor='remember-me' className='ml-2 text-xs font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700 transition-colors'>
                  Remember this device
                </label>
              </div>

              {globalError && <p className='text-xs text-red-500 mt-1'>{globalError}</p>}

              <button
                type='submit'
                disabled={loginMutation.isPending}
                className='mt-2 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50'
              >
                {loginMutation.isPending ? 'Authenticating...' : 'Sign in'}
              </button>
            </form>

            {/* ── NEW FEATURE: VISUAL BREAK & INTEGRATED SOCIAL SIGN IN ROW ── */}
            <div className='mt-5 flex items-center justify-between gap-3'>
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
            {/* ───────────────────────────────────────────────────────────── */}
            
            <p className='mt-6 text-center text-xs text-gray-400'>
              Don&apos;t have an account?{' '}
              <Link href={`/sign-up?from=${returnTo}`} className='text-gray-700 font-medium underline underline-offset-2 hover:text-gray-900'>
                Get started
              </Link>
            </p>
          </div>

          {/* STEP 1: Forgot Password Initial Form Panel */}
          <div className='w-full flex-shrink-0 p-8'>
            <h1 className='mb-1 text-xl font-semibold text-gray-900'>Reset Password</h1>
            <p className='mb-6 text-sm text-gray-500'>Enter your registration email identity parameter to get a verification code</p>
            
            <form onSubmit={forgotForm.handleSubmit((vals) => forgotMutation.mutate(vals))} className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-gray-700' htmlFor='forgot-email'>Email address</label>
                <input
                  id='forgot-email'
                  type='email'
                  {...forgotForm.register('email')}
                  placeholder='you@example.com'
                  className='rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
                />
                {forgotForm.formState.errors.email && (
                  <p className='text-xs text-red-500'>{forgotForm.formState.errors.email.message}</p>
                )}
              </div>

              {globalError && <p className='text-xs text-red-500 mt-1'>{globalError}</p>}

              <div className='flex gap-3 mt-2'>
                <button
                  type='button'
                  onClick={() => navigateToStep(0)}
                  disabled={forgotMutation.isPending}
                  className='flex-1 rounded-md border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50'
                >
                  Back
                </button>
                <button
                  type='submit'
                  disabled={forgotMutation.isPending || resendCooldown > 0}
                  className='flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50'
                >
                  {forgotMutation.isPending
                    ? 'Sending...'
                    : resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : 'Get OTP Code'}
                </button>
              </div>
            </form>
          </div>

          {/* STEP 2: 4-Box Split Verification Code Field Panel */}
          <div className='w-full flex-shrink-0 p-8 flex flex-col justify-center min-h-[340px]'>
            <h1 className='mb-1 text-xl font-semibold text-gray-900'>Enter OTP Code</h1>
            
            {successNotice && (
              <div className='mb-4 rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700 leading-relaxed animate-scaleUp'>
                {successNotice}
              </div>
            )}
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                if (otp.length === 4) otpVerifyMutation.mutate()
              }} 
              className='flex flex-col gap-4'
            >
              <div className='flex flex-col gap-2'>
                <div className='flex justify-center gap-3 mt-2'>
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      type='text'
                      maxLength={1}
                      inputMode='numeric'
                      pattern='[0-9]*'
                      value={otp[index] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        const currentOtpArr = otp.split('')
                        currentOtpArr[index] = val
                        const newOtpValue = currentOtpArr.join('')
                        setOtp(newOtpValue)
                        setOtpError('')

                        if (val && e.target.nextElementSibling) {
                          ;(e.target.nextElementSibling as HTMLInputElement).focus()
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[index] && (e.target as HTMLInputElement).previousElementSibling) {
                          ;((e.target as HTMLInputElement).previousElementSibling as HTMLInputElement).focus()
                        }
                      }}
                      className='w-12 h-12 text-center text-xl font-bold font-mono rounded-lg border border-gray-200 bg-white shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    />
                  ))}
                </div>
              </div>

              {otpError && <p className='text-xs text-red-500 mt-1 text-center'>{otpError}</p>}

              <p className='text-center text-xs text-gray-400 mt-1'>
                {resendCooldown > 0 ? (
                  <span>Didn't get a code? Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type='button'
                    onClick={() => forgotMutation.mutate({ email: activeEmail })}
                    disabled={forgotMutation.isPending}
                    className='font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900 disabled:opacity-50'
                  >
                    {forgotMutation.isPending ? 'Resending...' : 'Resend code'}
                  </button>
                )}
              </p>

              <div className='flex gap-3 mt-2'>
                <button
                  type='button'
                  onClick={() => navigateToStep(1)}
                  disabled={otpVerifyMutation.isPending}
                  className='flex-1 rounded-md border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50'
                >
                  Back
                </button>
                <button
                  type='submit'
                  disabled={otpVerifyMutation.isPending || otp.length < 4}
                  className='flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50'
                >
                  {otpVerifyMutation.isPending ? 'Checking...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          </div>

          {/* STEP 3: Password Update Form Input Panel */}
          <div className='w-full flex-shrink-0 p-8'>
            {resetMutation.isSuccess ? (
              <div className='flex flex-col items-center justify-center py-6 text-center animate-scaleUp'>
                <div className='relative flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500 mb-4 border border-green-200'>
                  <svg className='h-8 w-8 stroke-current transition-all duration-1000' fill='none' viewBox='0 0 24 24' strokeWidth='3'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                  </svg>
                </div>
                <h2 className='text-lg font-semibold text-gray-900'>Password Reset!</h2>
                <p className='text-sm text-gray-500 mt-1'>{successNotice}</p>
              </div>
            ) : (
              <>
                <h1 className='mb-1 text-xl font-semibold text-gray-900'>New Password</h1>
                <p className='mb-6 text-sm text-gray-500'>Establish your new login parameters below</p>
                
                <form onSubmit={resetForm.handleSubmit((vals) => resetMutation.mutate(vals))} className='flex flex-col gap-4'>
                  <div className='flex flex-col gap-1.5'>
                    <label className='text-sm font-medium text-gray-700' htmlFor='new-pass'>New Password</label>
                    <input
                      id='new-pass'
                      type='password'
                      {...resetForm.register('newPassword')}
                      placeholder='••••••••'
                      className='rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
                    />
                    {resetForm.formState.errors.newPassword && (
                      <p className='text-xs text-red-500'>{resetForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>

                  <div className='flex flex-col gap-1.5'>
                    <label className='text-sm font-medium text-gray-700' htmlFor='confirm-pass'>Confirm Password</label>
                    <input
                      id='confirm-pass'
                      type='password'
                      {...resetForm.register('confirmPassword')}
                      placeholder='••••••••'
                      className='rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100'
                    />
                    {resetForm.formState.errors.confirmPassword && (
                      <p className='text-xs text-red-500'>{resetForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {globalError && <p className='text-xs text-red-500 mt-1'>{globalError}</p>}

                  <button
                    type='submit'
                    disabled={resetMutation.isPending}
                    className='mt-2 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50'
                  >
                    {resetMutation.isPending ? 'Saving adjustments...' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}
          </div>

        </div>

      </div>
    </main>
  )
}
