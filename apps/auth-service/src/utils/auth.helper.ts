import crypto from 'crypto'
import { RateLimitError, TokenExpiredError, ValidationError } from '../../../../packages/error-handler';
import redis from '../../../../packages/lib/redis';
import { sendEmail } from './sendMail';
import { RegistrationPayload } from '../../types/types';
import { prisma } from '../../../../packages/lib/prisma';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const validateRegistrationData = (data: RegistrationPayload) => {
  if (!data.account?.email || !data.account?.password || !data.account?.name) {
    throw new ValidationError("Missing mandatory authentication fields (name, email, password).");
  }

  if (!emailRegex.test(data.account.email)) {
    throw new ValidationError("Invalid email format");
  }

  if (!["CUSTOMER", "SELLER", "ADMIN"].includes(data.role)) {
    throw new ValidationError("A valid role ('CUSTOMER', 'SELLER', or 'ADMIN') must be provided.");
  }

  if (data.role === "SELLER") {
    // ✅ TS now narrows `data` itself to the SELLER branch of the union
    const { account, sellerProfile } = data; // safe — no error

    if (!sellerProfile?.businessName || !sellerProfile?.businessType) {
      throw new ValidationError("Sellers must provide a business name and business type.");
    }

    if (sellerProfile.businessType === "REGISTERED_COMPANY" && !sellerProfile.taxId) {
      throw new ValidationError("Registered companies must provide a valid tax ID.");
    }

    return {
      account,
      sellerProfile: {
        ...sellerProfile,
        taxId: sellerProfile.taxId ?? null,
        payoutBankDetails: sellerProfile.payoutBankDetails ?? null,
        isVerified: false,
      },
    };
  }

  // ✅ Here, TS narrows `data` to the CUSTOMER branch
  const { account, customerProfile } = data;

  return {
    account,
    customerProfile: {
      phoneNumber: customerProfile?.phoneNumber,
      dateOfBirth: customerProfile?.dateOfBirth,
      gender: customerProfile?.gender,
      address: customerProfile?.address,
      preferences: {
        currency: customerProfile?.preferences?.currency ?? "USD",
        language: customerProfile?.preferences?.language ?? "en",
        marketingConsent: !!customerProfile?.preferences?.marketingConsent,
        pushNotifications: !!customerProfile?.preferences?.pushNotifications,
      },
    },
  };
};

export const checkOtpRestrictions = async (
  email: string,
  ipAddress: string // Added for network-level protection
) => {
  // Global Account Suspension (The "Kill Switch")
  if (await redis.get(`account_suspended:${email}`)) {
    throw new ValidationError("This account is currently suspended. Please contact support.");
  }

  // IP-Based Rate Limiting (Botnet Defense)
  const ipRequests = await redis.get(`otp_ip_count:${ipAddress}`);
  if (ipRequests && parseInt(ipRequests) >= 20) { 
    // e.g., Max 20 OTP requests per IP per hour
    throw new RateLimitError("Too many requests from your network. Please try again later.");
  }

  // Daily Hard Limit (Slow-Drip Spam Defense)
  const dailyRequests = await redis.get(`otp_daily_count:${email}`);
  if (dailyRequests && parseInt(dailyRequests) >= 5) {
    throw new RateLimitError("Daily OTP limit reached (Max 5 per day). Please try again tomorrow.");
  }

  // The "Already Verified" State
  // Prevents users from requesting an OTP if their session is already in a privileged state.
  if (await redis.get(`otp_verified_session:${email}`)) {
    throw new ValidationError("This session is already verified.");
  }

  // The Cooldown (Anti-Spam)
  if (await redis.get(`otp_cooldown:${email}`)) {
    throw new ValidationError("Please wait one minute before requesting a new OTP.");
  }

  // The Span Lock (Medium-term abuse)
  if (await redis.get(`otp_spam_lock:${email}`)) {
    throw new ValidationError("Too many OTP requests! Please wait an hour before requesting again.");
  }

  // The Failure Lock (Anti-Brute Force)
  if (await redis.get(`otp_lock:${email}`)) {
    throw new ValidationError("Account locked due to multiple failed attempts. Try again after 30 minutes.");
  }
};

export const trackOtpRequests = async (
  email: string
) => {
  const otpRequestKey = `otp_request_count:${email}`;

  let otpRequest = parseInt((await redis.get(otpRequestKey)) || "0");

  if (otpRequest >= 5) {
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600) // lock for an hour
    throw new ValidationError("Too many Otp requests. Please wait an hour before requesting again")
  }

  await redis.set(otpRequestKey, otpRequest + 1, "EX", 3600) // Tracking th enumber of requests within an hour
}

export const sendOtp = async (name: string, email: string, ipAddress: any, template: string) => {
  const otp = crypto.randomInt(1000, 9999).toString();

  await sendEmail(email, "Verify your email", template, {name, otp});

  //  expiry time limit
  const otpExpirationTime = 5 * 60;

  await redis.set(`otp:${email}`, otp, "EX", otpExpirationTime)

  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60)

  const dailyKey = `otp_daily_count:${email}`;
  const dailyCount = await redis.incr(dailyKey);
  if (dailyCount === 1) {
    await redis.expire(dailyKey, 86400); // 24 hours
  }

  const ipKey = `otp_ip_count:${ipAddress}`;
  const ipCount = await redis.incr(ipKey);
  if (ipCount === 1) {
    await redis.expire(ipKey, 3600); // 1 hour
  }
}

/**
 * Sets a temporary verified session flag in Redis.
 * Call this in your controller ONLY AFTER the user provides the correct OTP.
 * * @param email - The user's email
 * @param durationInMinutes - How long the session stays verified (defaults to 15 minutes)
 */
export const markSessionAsVerified = async (email: string, durationInMinutes: number = 15) => {
  const durationInSeconds = durationInMinutes * 60;
  
  // Set the key that 'checkOtpRestrictions' looks for to prevent further OTP requests
  await redis.set(`otp_verified_session:${email}`, "verified", "EX", durationInSeconds);
  
  // Clean up the used OTP so it cannot be reused
  await redis.del(`otp:${email}`);
  
  // Optional: Reset their request count since they successfully verified
  await redis.del(`otp_request_count:${email}`);
};


/**
 * Permanently locks an account at the Redis level.
 * Call this from an Admin controller or an automated fraud-detection webhook.
 * * @param email - The user's email to suspend
 */
export const suspendUserAccount = async (email: string) => {
  // Notice there is no "EX" expiration. This lasts until manually removed.
  await redis.set(`account_suspended:${email}`, "true");
};

/**
 * Removes the permanent lock on an account.
 * Call this from an Admin controller when an account is reinstated.
 * * @param email - The user's email to unsuspend
 */
export const reinstateUserAccount = async (email: string) => {
  await redis.del(`account_suspended:${email}`);
};

// auth.helper.ts
export const initiatePasswordReset = async (email: string, ipAddress: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    
    // 1. Check database
    const user = await prisma.users.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
        return { success: true, message: "If an account exists, an OTP has been sent." };
    }

    // 2. Business logic (Rate limits)
    await checkOtpRestrictions(normalizedEmail, ipAddress);
    await trackOtpRequests(normalizedEmail);

    // 3. Trigger side effect
    await sendOtp(user.name, normalizedEmail, ipAddress, "forgot-password-user-mail");

    return { success: true, message: "OTP sent to your email." };
};

export const verifyForgetPasswordOtp = async (email: string, otp: string) => {
  const normalizedEmail = email.trim().toLowerCase()
  
  if (!normalizedEmail || !otp) {
    throw new ValidationError("Email and OTP are required.");
  }

  const storedOtp = await redis.get(`otp:${normalizedEmail}`);
  if (!storedOtp || storedOtp !== otp.toString()) {
    throw new TokenExpiredError("Invalid or expired OTP.");
  }

    // Mark as verified so they can proceed to reset password
  await markSessionAsVerified(normalizedEmail); 
    
  return { success: true };
}