import { Router } from "express"
import express from "express"
import { stripeWebhookHandler, createSellerOnboardingLink, verifyStripeAccountStatus } from "../controllers/payment.controller"
import { authenticate } from "../../../../packages/auth-handler/auth.middleware"
import { isSeller } from "../../../../packages/auth-handler/role.middleware"

const paymentRouter = Router()

paymentRouter.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  /* #swagger.tags = ['Payment'] */
  stripeWebhookHandler
);

paymentRouter.use(express.json()); // everything else

paymentRouter.post(
  "/seller/stripe/onboarding-link", 
  authenticate, 
  isSeller, 
  /* #swagger.tags = ['Payment'] */
  createSellerOnboardingLink
);

paymentRouter.get(
  "/seller/stripe/verify-status", 
  authenticate, 
  isSeller, 
  verifyStripeAccountStatus
);

export default paymentRouter;