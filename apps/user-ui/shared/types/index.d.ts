declare interface User {
  id: string
  name: string
  email: string
  role: "CUSTOMER" | "SELLER" | "ADMIN"
  following: string[]
  createdAt: string
  updatedAt: string
  avatar: { id: string; url: string } | null
  customerProfile?: {
    id: string
    userId: string
    phoneNumber?: string | null
    dateOfBirth?: string | null
    gender?: "MALE" | "FEMALE" | "PREFER_NOT_TO_SAY" | null
    preferences?: {
      currency?: string | null
      language?: string | null
      marketingConsent?: boolean | null
      pushNotifications?: boolean | null
    } | null
    address?: {
      street: string
      city: string
      state: string
      country: string
      postalCode?: string | null
    } | null
  } | null
  sellerProfile?: {
    businessName: string
    businessType: "RETAIL" | "SERVICES" | "REGISTERED_COMPANY"
    taxId?: string | null
    storeDescription?: string | null
    isVerified: boolean
  } | null
}

declare interface UserContextValue {
    user: User | null;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
    clearUser: () => void;
}

declare interface BackendLoginResponse {
  status: boolean;
  message: string;
  user: User;
}

declare interface GenericStatusResponse {
  success: boolean;
  message: string;
}

declare interface StructuredAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

declare interface RetryRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

declare interface FlatCategory {
  name: string;
  href: string;
  breadcrumbs: Array<{ name: string; href: string }>;
}

declare interface AccountMenuProps {
  user: User | null
  isLoading: boolean
  isError: boolean
  refetch: () => void
  onSignOut: () => void
}

declare interface PageProps {
  params: Promise<{ slug: string[] }>;
}