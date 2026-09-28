'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';

import { useUser } from '../../../context/user-context';
import { apiRequest } from '@/utils/fetch';
import CreateShop from '@/components/create-shop';

import { FaGoogle, FaApple } from 'react-icons/fa';

import { registrationSchema } from '@/utils/lib';

import { COUNTRIES } from '@/utils/countries';

type SignUpFormValues = z.infer<typeof registrationSchema>;

function SignupPageContent() {
  const { refetch } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('from') ?? '/';

  // Workflow tracking
  const [step, setStep] = useState<number>(0);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [globalError, setGlobalError] = useState('');

  const [resendCountdown, setResendCountdown] = useState(0); // 0-second at the beginning, updates to 30 when reched the 4th step screen
  const canResend = resendCountdown === 0;

  const [showShopSetup, setShowShopSetup] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string>('');

  useEffect(() => {
    // Calls your auth service endpoint through the gateway to set the cookie in the browser
    apiRequest('/api/users/api/csrf-token').catch((err) =>
      console.error('Failed to initialize CSRF token cookie', err),
    );
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTO-HEIGHT TRACK: measures only the currently active step's real content
  // height (via ResizeObserver, so conditional fields like Tax ID are picked
  // up automatically) and animates the viewport wrapper to match it exactly.
  // ─────────────────────────────────────────────────────────────────────────────
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [trackHeight, setTrackHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const activeEl = stepRefs.current[step];
    if (!activeEl) return;

    setTrackHeight(activeEl.offsetHeight);

    const observer = new ResizeObserver(() => {
      const el = stepRefs.current[step];
      if (el) setTrackHeight(el.offsetHeight);
    });
    observer.observe(activeEl);
    return () => observer.disconnect();
  }, [step]);

  useEffect(() => {
    if (resendCountdown === 0) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  const STEP_INDICATOR: Record<number, number> = {
    1: 1, // Credentials
    2: 1, // Phone & Country (same indicator as Credentials)
    3: 2, // Business Profile → "Setup Shop"
    4: 3, // Connect Bank
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. UNIFIED FORM SETUP (REACT HOOK FORM)
  // role is locked to 'SELLER' — the field still exists (schema/API still
  // expect it) but there's no way to change it from the UI anymore.
  // ─────────────────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
    defaultValues: {
      role: 'SELLER',
      name: '',
      email: '',
      password: '',
      phoneNumber: '',
      country: '',
      businessName: '',
      businessType: 'FREELANCER',
      taxId: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
    },
  });

  const userEmail = watch('email');

  // Step Navigators matching field checks before track transitions
  const handleNextStep = async (
    fieldsToValidate: (keyof SignUpFormValues)[],
  ) => {
    setGlobalError('');
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setGlobalError('');
    setStep((prev) => Math.max(0, prev - 1));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. MUTATION OPERATIONS (TANSTACK QUERY)
  // ─────────────────────────────────────────────────────────────────────────────

  // Phase 1: Post Payload Configuration down to Redis / dispatch execution
  const initiateRegistrationMutation = useMutation({
    mutationFn: async (values: SignUpFormValues) => {
      const payload = {
        role: 'SELLER' as const,
        account: {
          name: values.name,
          email: values.email,
          password: values.password,
        },
        sellerProfile: {
          country: values.country,
          phoneNumber: values.phoneNumber,
          businessName: values.businessName,
          businessType: values.businessType,
          taxId:
            values.businessType === 'SOLE_PROPRIETOR'
              ? values.taxId
              : undefined,
          payoutBankDetails: {
            bankName: values.bankName,
            accountNumber: values.accountNumber,
            accountName: values.accountName,
          },
        },
      };

      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
      };

      // Match the cookie name defined in your backend setup: "x-csrf-token"
      const csrfToken = getCookie('x-csrf-token');

      return apiRequest<{
        success: boolean;
        message: string;
      }>('/api/users/auth/user-registration', {
        method: 'POST',
        body: payload,
        headers: {
          'x-csrf-token': csrfToken || '',
        },
      });
    },
    onSuccess: (res) => {
      setSuccessMsg(res.message || 'OTP sent to email.');
      setStep(5);
      setResendCountdown(30);
    },
    onError: (err: any) => {
      setGlobalError(
        err.message ||
          'Registration initialization failed. Check your data inputs.',
      );
    },
  });

  // Phase 2: Complete Code confirmation to absolute DB state write
  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
      };
      const csrfToken = getCookie('x-csrf-token');

      return apiRequest<{
        success: boolean;
        data: {
          id: string;
          email: string;
          role: string;
          name: string;
          avatarUrl?: string;
        };
      }>('/api/users/auth/verify-registration', {
        method: 'POST',
        body: { email: userEmail, otp },
        headers: {
          'x-csrf-token': csrfToken || '',
        },
      });
    },
    onSuccess: (res) => {
      if (res.data?.id) {
        setRegisteredUserId(res.data.id);
      }

      setTimeout(async () => {
        await refetch();
        setStep(6);
      }, 2000);
    },
    onError: (err: any) => {
      setOtpError(err.message || 'Invalid activation code entry. Try again.');
    },
  });

  const handleResendOtp = () => {
    if (!canResend || initiateRegistrationMutation.isPending) return;

    // Grabs the fresh, current state of all fields across your multi-step form
    const currentFormValues = getValues();

    initiateRegistrationMutation.mutate(currentFormValues, {
      onSuccess: (res) => {
        setSuccessMsg(res.message || 'A fresh code has been sent.');
        setResendCountdown(30); // Reset countdown only on a true successful dispatch
      },
      onError: (err: any) => {
        setOtpError(
          err.message || 'Failed to resend activation code. Please try again.',
        );
      },
    });
  };

  return (
    // ─────────────────────────────────────────────────────────────────────────
    // BACKGROUND IMAGE WRAPPER
    // h-[calc(100vh-68px)] matches your site header's height so this fills
    // exactly one screen without a scroll gap. lg+ screens show the pedestal
    // image as a full-bleed background behind the card.
    // ─────────────────────────────────────────────────────────────────────────
    <main
      className="flex h-screen w-full overflow-hidden items-center justify-center bg-gray-50 px-4
                 bg-[url(/signup-bg.png)] bg-cover bg-center bg-no-repeat"
    >
      {showShopSetup ? (
        <CreateShop
          sellerId={registeredUserId}
          setActiveStep={() => router.push(returnTo)}
        />
      ) : (
        <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 lg:shadow-2xl lg:shadow-black/20">
          {/* STEP INDICATOR — only shown across the 3 real data-entry steps
              (Role selection and OTP verification aren't part of the tracked
              progress). step > s.index marks a step as completed (checkmark);
              step === s.index marks it active; otherwise it's upcoming. */}
          {step >= 1 && step <= 4 && (
            <div className="flex items-center px-8 pt-6">
              {[
                { index: 1, label: 'Create Account' },
                { index: 2, label: 'Setup Shop' },
                { index: 3, label: 'Connect Bank' },
              ].map((s, i, arr) => {
                const activeIndicator = STEP_INDICATOR[step] ?? 0;
                return (
                  <div
                    key={s.index}
                    className="flex flex-1 items-center last:flex-initial"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                          activeIndicator >= s.index
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {activeIndicator > s.index ? '✓' : s.index}
                      </div>
                      <span
                        className={`whitespace-nowrap text-[10px] font-medium ${activeIndicator >= s.index ? 'text-gray-700' : 'text-gray-400'}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div
                        className={`mx-2 mb-4 h-[2px] flex-1 transition-colors ${activeIndicator > s.index ? 'bg-gray-900' : 'bg-gray-200'}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Animated Slide Viewport Window Wrapper — height is set in JS to match
              the currently active step's real content height, so the card always
              hugs exactly what's on screen instead of matching the tallest step. */}
          <div
            className="overflow-hidden transition-[height] duration-500 ease-out"
            style={{ height: trackHeight }}
          >
            <div
              className="flex items-start transition-transform duration-500 ease-out will-change-transform"
              style={{ transform: `translateX(-${step * 100}%)` }}
            >
              {/* STEP 0: Role Panel — kept for the visual, but locked to Seller.
                The select only has one option and is disabled so it can't be
                changed; register('role') still reports 'SELLER' via defaultValues. */}
              <div
                ref={(el) => {
                  stepRefs.current[0] = el;
                }}
                className="w-full flex-shrink-0 p-8"
              >
                <h1 className="mb-1 text-xl font-semibold text-gray-900">
                  Join Hadron
                </h1>
                <p className="mb-6 text-sm text-gray-500">
                  Set up your merchant account to start selling.
                </p>

                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor="role"
                    >
                      Register account as a:
                    </label>
                    <select
                      id="role"
                      disabled
                      value="SELLER"
                      className="w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 outline-none"
                    >
                      <option value="SELLER">
                        Merchant Seller (List & Manage Products)
                      </option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mt-2 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85"
                  >
                    Continue
                  </button>
                </div>
              </div>

              {/* STEP 1: Core Credentials */}
              <div
                ref={(el) => {
                  stepRefs.current[1] = el;
                }}
                className="w-full flex-shrink-0 p-8"
              >
                <h1 className="mb-1 text-xl font-semibold text-gray-900">
                  Account Details
                </h1>
                <p className="mb-6 text-sm text-gray-500">
                  Provide basic log-in profile parameters
                </p>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor="name"
                    >
                      Full name
                    </label>
                    <input
                      id="name"
                      type="text"
                      {...register('name')}
                      placeholder="Yemuel Oseghale"
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="you@example.com"
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      {...register('password')}
                      placeholder="••••••••"
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                    {errors.password && (
                      <p className="text-xs text-red-500">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 rounded-md border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleNextStep(['name', 'email', 'password'])
                      }
                      className="flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>

              {/* STEP 2: Phone & Country — grouped under "Create Account" indicator */}
              <div
                ref={(el) => {
                  stepRefs.current[2] = el;
                }}
                className="w-full flex-shrink-0 p-8"
              >
                <h1 className="mb-1 text-xl font-semibold text-gray-900">
                  Contact details
                </h1>
                <p className="mb-6 text-sm text-gray-500">
                  Where can buyers and support reach you?
                </p>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor="phoneNumber"
                    >
                      Phone Number
                    </label>
                    <input
                      id="phoneNumber"
                      type="text"
                      {...register('phoneNumber')}
                      placeholder="+234 123 456 7890"
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                    {errors.phoneNumber && (
                      <p className="text-xs text-red-500">
                        {errors.phoneNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <select
                      id="country"
                      {...register('country')}
                      className="w-full appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 pr-9 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      {/* <option value=''>Select your country</option> */}
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 rounded-md border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNextStep(['phoneNumber', 'country'])}
                      className="flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>

              {/* STEP 2: Business Profile (Seller only) */}
              <div
                ref={(el) => {
                  stepRefs.current[3] = el;
                }}
                className="w-full flex-shrink-0 p-8"
              >
                <h1 className="mb-1 text-xl font-semibold text-gray-900">
                  Business Profile
                </h1>
                <p className="mb-6 text-sm text-gray-500">
                  Complete context profiles to customize experience
                </p>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor="bizName"
                    >
                      Business Name
                    </label>
                    <input
                      id="bizName"
                      type="text"
                      {...register('businessName')}
                      placeholder="Hadron Merchant LLC"
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                    {errors.businessName && (
                      <p className="text-xs text-red-500">
                        {errors.businessName.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor="bizType"
                    >
                      Company Structure
                    </label>
                    <select
                      id="bizType"
                      {...register('businessType')}
                      className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    >
                      <option value="CORPORATION">
                        Sole Proprietor / Individual
                      </option>
                      <option value="FREELANCER">
                        Sole Proprietor / Services
                      </option>
                      <option value="SOLE_PROPRIETOR">
                        Registered Corporate entity
                      </option>
                    </select>
                  </div>
                  {watch('businessType') === 'SOLE_PROPRIETOR' && (
                    <div className="flex flex-col gap-1.5 animate-fadeIn">
                      <label
                        className="text-sm font-medium text-gray-700"
                        htmlFor="taxId"
                      >
                        Tax ID (TIN)
                      </label>
                      <input
                        id="taxId"
                        type="text"
                        {...register('taxId')}
                        placeholder="12345678-0001"
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                      {errors.taxId && (
                        <p className="text-xs text-red-500">
                          {errors.taxId.message}
                        </p>
                      )}
                    </div>
                  )}

                  {globalError && (
                    <p className="text-xs text-red-500 mt-1">{globalError}</p>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 rounded-md border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleNextStep(
                          watch('businessType') === 'SOLE_PROPRIETOR'
                            ? ['businessName', 'businessType', 'taxId']
                            : ['businessName', 'businessType'],
                        )
                      }
                      className="flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>

              {/* STEP 3: Connect Bank (Seller only) — UI only for now; bank fields
                  live in local state and aren't part of registrationSchema or the
                  mutation payload yet. Wire up validation/payload however your
                  payout provider needs when you implement this. */}
              <div
                ref={(el) => {
                  stepRefs.current[4] = el;
                }}
                className="w-full flex-shrink-0 p-8"
              >
                <h1 className="mb-1 text-xl font-semibold text-gray-900">
                  Connect Bank
                </h1>
                <p className="mb-6 text-sm text-gray-500">
                  Add payout details so you can receive earnings from sales.
                </p>

                <form
                  onSubmit={handleSubmit(
                    (vals: SignUpFormValues) =>
                      initiateRegistrationMutation.mutate(vals),
                    (errs) => console.log('Validation failed:', errs),
                  )}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor="bankName"
                    >
                      Bank Name
                    </label>
                    <input
                      id="bankName"
                      type="text"
                      {...register('bankName')}
                      placeholder="First Bank of Nigeria"
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                    {errors.bankName && (
                      <p className="text-xs text-red-500">
                        {errors.bankName.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor="accountNumber"
                    >
                      Account Number
                    </label>
                    <input
                      id="accountNumber"
                      type="text"
                      inputMode="numeric"
                      {...register('accountNumber')}
                      placeholder="0123456789"
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                    {errors.accountNumber && (
                      <p className="text-xs text-red-500">
                        {errors.accountNumber.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor="accountName"
                    >
                      Account Name
                    </label>
                    <input
                      id="accountName"
                      type="text"
                      {...register('accountName')}
                      placeholder="John Doe"
                      className="rounded-md 
                      border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    />
                    {errors.accountName && (
                      <p className="text-xs text-red-500">
                        {errors.accountName.message}
                      </p>
                    )}
                  </div>

                  {globalError && (
                    <p className="text-xs text-red-500 mt-1">{globalError}</p>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={initiateRegistrationMutation.isPending}
                      className="flex-1 rounded-md border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={initiateRegistrationMutation.isPending}
                      className="flex-1 rounded-md bg-gray-900 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                    >
                      {initiateRegistrationMutation.isPending
                        ? 'Processing...'
                        : 'Send OTP Mail'}
                    </button>
                  </div>
                </form>
              </div>

              {/* STEP 4: OTP Verification Screen */}
              <div
                ref={(el) => {
                  stepRefs.current[5] = el;
                }}
                className="w-full flex-shrink-0 p-8 flex flex-col justify-center min-h-[380px]"
              >
                {verifyOtpMutation.isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center animate-scaleUp">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500 mb-4 border border-green-200">
                      <svg
                        className="h-8 w-8 stroke-current transition-all duration-1000 [stroke-dasharray:100] [stroke-dashoffset:100] animate-[dash_1s_ease-in-out_forwards]"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Account Verified!
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Syncing details and initializing workspace session...
                    </p>
                  </div>
                ) : (
                  <>
                    <h1 className="mb-1 text-xl font-semibold text-gray-900">
                      Verify your Email
                    </h1>

                    {successMsg && (
                      <div className="mb-5 rounded-lg bg-blue-50/70 border border-blue-100 p-3 text-xs text-blue-700 leading-relaxed">
                        {successMsg}
                      </div>
                    )}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (otp.length === 4) verifyOtpMutation.mutate();
                      }}
                      className="flex flex-col gap-5"
                    >
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 text-center md:text-left">
                          Enter Verification Code
                        </label>

                        <div className="flex justify-center gap-3">
                          {[0, 1, 2, 3].map((index) => (
                            <input
                              key={index}
                              type="text"
                              maxLength={1}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={otp[index] || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                const currentOtpArr = otp.split('');
                                currentOtpArr[index] = val;
                                const newOtpValue = currentOtpArr.join('');
                                setOtp(newOtpValue);
                                setOtpError('');

                                if (val && e.target.nextElementSibling) {
                                  (
                                    e.target
                                      .nextElementSibling as HTMLInputElement
                                  ).focus();
                                }
                              }}
                              onKeyDown={(e) => {
                                if (
                                  e.key === 'Backspace' &&
                                  !otp[index] &&
                                  (e.target as HTMLInputElement)
                                    .previousElementSibling
                                ) {
                                  (
                                    (e.target as HTMLInputElement)
                                      .previousElementSibling as HTMLInputElement
                                  ).focus();
                                }
                              }}
                              className="w-12 h-12 text-center text-xl font-bold font-mono rounded-lg border border-gray-200 bg-white shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          ))}
                        </div>
                      </div>

                      {otpError && (
                        <p className="text-xs text-red-500 mt-1 text-center">
                          {otpError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={verifyOtpMutation.isPending || otp.length < 4}
                        className="mt-2 rounded-md bg-gray-900 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                      >
                        {verifyOtpMutation.isPending
                          ? 'Verifying...'
                          : 'Complete Registration'}
                      </button>

                      {/* RESEND OTP BUTTON */}
                      <div className="text-center mt-1">
                        <button
                          type="button"
                          disabled={
                            !canResend ||
                            verifyOtpMutation.isPending ||
                            initiateRegistrationMutation.isPending
                          }
                          onClick={handleResendOtp}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:no-underline transition-colors underline underline-offset-4"
                        >
                          {initiateRegistrationMutation.isPending
                            ? 'Sending code...'
                            : canResend
                              ? 'Resend Code'
                              : `Resend Code in ${resendCountdown}s`}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handlePrevStep}
                        disabled={verifyOtpMutation.isPending}
                        className="text-center text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1 underline underline-offset-4"
                      >
                        Back to edit profile info
                      </button>
                    </form>
                  </>
                )}
              </div>

              {/* STEP 5 (Index 6): The Decision Screen */}
              <div
                ref={(el) => {
                  stepRefs.current[6] = el;
                }}
                className="w-full flex-shrink-0 p-8 flex flex-col justify-center min-h-[380px]"
              >
                <div className="flex flex-col items-center text-center animate-scaleUp">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500 mb-4 border border-blue-200">
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 21v-7.5a2.25 2.25 0 012.25-2.25h1.5a2.25 2.25 0 012.25 2.25v7.5m-6.75-6h2.25m-9-2.25h15m-15 0v-2.25a2.25 2.25 0 012.25-2.25h10.5a2.25 2.25 0 012.25 2.25v2.25m-15 0v11.25a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V10.5"
                      />
                    </svg>
                  </div>
                  <h1 className="mb-2 text-xl font-semibold text-gray-900">
                    Registration Complete!
                  </h1>
                  <p className="mb-8 text-sm text-gray-500">
                    Your merchant account is ready. Would you like to set up
                    your storefront now, or do it later from your dashboard?
                  </p>

                  <div className="flex w-full flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setShowShopSetup(true)}
                      className="w-full rounded-md bg-gray-900 py-3 text-sm font-medium text-white transition-opacity hover:opacity-85 shadow-sm"
                    >
                      Set up my shop now
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(returnTo)}
                      className="w-full rounded-md border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Skip to dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Global Footer Navigation Links Context */}
          {step < 4 && (
            <>
              <div className="w-full overflow-hidden items-center justify-center bg-gray-50 px-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-[1px] flex-1 bg-gray-200" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 select-none">
                    Or continue with
                  </span>
                  <div className="h-[1px] flex-1 bg-gray-200" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => alert('OAuth flow integration placeholder')}
                    className="flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <FaGoogle className="h-3.5 w-3.5 text-red-500" />
                    <span>Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('OAuth flow integration placeholder')}
                    className="flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <FaApple className="h-3.5 w-3.5 text-gray-900" />
                    <span>Apple</span>
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-100 bg-gray-50/50 px-8 py-4 text-center">
                <p className="text-xs text-gray-400">
                  Already have an account?{' '}
                  <Link
                    href={`/log-in?from=${returnTo}`}
                    className="text-gray-700 font-medium underline underline-offset-2 hover:text-gray-900"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}

export default function SignupPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <SignupPageContent />
    </React.Suspense>
  )
}
