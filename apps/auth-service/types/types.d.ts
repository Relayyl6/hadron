import { BusinessType } from '@prisma/client'

export interface AccountPayload {
  name: string;
  email: string;
  password: string;
  role: "CUSTOMER" | "SELLER" | "ADMIN";
}

// 2. A robust Customer-specific profile
export interface CustomerProfilePayload {
  phoneNumber?: string;
  dateOfBirth?: string; // ISO Date string (e.g., "1995-08-24")
  gender?: "MALE" | "FEMALE" | "PREFER_NOT_TO_SAY";
  
  // Grouping preferences keeps the top-level clean
  preferences?: {
    currency?: string; // e.g., "NGN", "USD"
    language?: string; // e.g., "en", "fr"
    marketingConsent?: boolean;
    pushNotifications?: boolean;
  };

  // Standardizing address structure early saves huge headaches later
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
  };
}

// 3. A robust Seller-specific profile (For reference)
export interface SellerProfilePayload {
  businessName: string;
  businessType: BusinessType; // e.g., "RETAIL", "SERVICES"
  taxId?: string;
  storeDescription?: string;
  payoutBankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export type RegistrationPayload =
  | { role: "CUSTOMER"; account: AccountPayload; customerProfile: CustomerProfilePayload }
  | { role: "SELLER"; account: AccountPayload; sellerProfile: SellerProfilePayload };

export interface AccessTokenPayload {
    id: string;
    role: "CUSTOMER" | "SELLER" | "ADMIN";
    iat?: number;
    exp?: number;
}