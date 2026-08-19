import swaggerAutogen from "swagger-autogen";

const docs = {
  info: {
    title: "Auth Service API",
    description: "Auth Service API documentation",
    version: "1.0.0",
  },
  host: "localhost:6001",
  basePath: "/",
  schemes: ["http"],

  // 1. ADD TAGS DEFINITIONS HERE
  tags: [
    {
      name: "Auth",
      description: "Endpoints for user authentication and registration"
    },
    {
      name: "Payment",
      description: "Endpoints for Stripe and payments"
    },
    {
      name: "Shop",
      description: "Endpoints for shop creation and management"
    }
  ],

  // Reusable schemas — reference these from route comments via
  // #swagger.parameters['body'] = { schema: { $ref: '#/definitions/X' } }
  definitions: {
    AccountPayload: {
      name: "Jane Doe",
      email: "jane@example.com",
      password: "Str0ngP@ssword!",
      role: "CUSTOMER", // "CUSTOMER" | "SELLER" | "ADMIN"
    },

    AddressPayload: {
      street: "12 Market Street",
      city: "Lagos",
      state: "Lagos",
      country: "NG",
      postalCode: "100001",
    },

    PreferencesPayload: {
      currency: "NGN",
      language: "en",
      marketingConsent: true,
      pushNotifications: true,
    },

    CustomerProfilePayload: {
      phoneNumber: "+2348012345678",
      dateOfBirth: "1995-08-24",
      gender: "PREFER_NOT_TO_SAY", // "MALE" | "FEMALE" | "PREFER_NOT_TO_SAY"
      preferences: { $ref: "#/definitions/PreferencesPayload" },
      address: { $ref: "#/definitions/AddressPayload" },
    },

    PayoutBankDetailsPayload: {
      bankName: "GTBank",
      accountNumber: "0123456789",
      accountName: "Jane Doe Enterprises",
    },

    SellerProfilePayload: {
      phoneNumber: "+2348012345678",
      country: "NG",
      businessName: "Jane's Boutique",
      businessType: "CORPORATION", // "CORPORATION" | "FREELANCER" | "SOLE_PROPRIETOR"
      taxId: "TIN-00234455",
      storeDescription: "Curated fashion and accessories.",
      payoutBankDetails: { $ref: "#/definitions/PayoutBankDetailsPayload" },
    },

    CustomerRegistrationPayload: {
      role: "CUSTOMER",
      account: { $ref: "#/definitions/AccountPayload" },
      customerProfile: { $ref: "#/definitions/CustomerProfilePayload" },
    },

    SellerRegistrationPayload: {
      role: "SELLER",
      account: { $ref: "#/definitions/AccountPayload" },
      sellerProfile: { $ref: "#/definitions/SellerProfilePayload" },
    },

    VerifyOtpPayload: {
      email: "jane@example.com",
      otp: "482913",
    },

    LoginPayload: {
      email: "jane@example.com",
      password: "Str0ngP@ssword!",
    },

    ForgetPasswordPayload: {
      email: "jane@example.com",
    },

    ResetPasswordPayload: {
      email: "jane@example.com",
      newPassword: "NewStr0ngP@ssword!",
    },

    ShopCreatePayload: {
      name: "Jane's Boutique",
      bio: "Curated fashion and accessories, sourced ethically.",
      category: "Fashion",
      coverBanner: "https://cdn.hadron.com/shops/janes-boutique/banner.jpg",
      address: "12 Market Street, Lagos, NG",
      opening_hours: "Mon–Sat, 9am–6pm",
      website: "https://janesboutique.com",
      socialLinks: [
        { platform: "instagram", url: "https://instagram.com/janesboutique" },
      ],
    },

    ShopUpdatePayload: {
      name: "Jane's Boutique",
      bio: "Updated shop bio.",
      category: "Fashion",
      coverBanner: "https://cdn.hadron.com/shops/janes-boutique/banner.jpg",
      address: "12 Market Street, Lagos, NG",
      opening_hours: "Mon–Sat, 9am–6pm",
      website: "https://janesboutique.com",
      socialLinks: [
        { platform: "instagram", url: "https://instagram.com/janesboutique" },
      ],
    },
  },
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./main.ts"];

swaggerAutogen(outputFile, endpointsFiles, docs);