import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { prisma } from "../../../../packages/lib/prisma";
import { ValidationError } from "../../../../packages/error-handler";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const createSellerOnboardingLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id; // set by your auth middleware
    if (!userId) throw new ValidationError("Unauthorized");

    // 1. Fetch the seller profile AND include the related User record to get the email
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        user: true, // Assuming your relation in Prisma schema is named 'user'
      },
    });

    if (!sellerProfile) throw new ValidationError("Seller profile not found");

    // Extract the email from the joined user table
    const email = sellerProfile.user?.email;
    if (!email) throw new ValidationError("User email not found");

    let stripeAccountId = sellerProfile.stripeAccountId;

    // 1. Create the Express account only once
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "GB", // ISO 3166-1 alpha-2, ensure this format
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type:
          sellerProfile.businessType === "SOLE_PROPRIETOR"
            ? "company"
            : "individual",
      });

      stripeAccountId = account.id;

      await prisma.sellerProfile.update({
        where: { userId },
        data: { stripeAccountId },
      });
    }

    // 2. Generate a fresh onboarding link every time (they expire)
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.CLIENT_URL}/seller/stripe/refresh`,
      return_url: `${process.env.CLIENT_URL}/seller/stripe/return`,
      type: "account_onboarding",
    });

    res.status(200).json({
      success: true,
      url: accountLink.url,
    });
  } catch (error) {
    next(error);
  }
};

export const stripeWebhookHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const signature = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw buffer — critical for signature verification
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed`);
  }

  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;

        await prisma.sellerProfile.updateMany({
          where: { stripeAccountId: account.id },
          data: {
            stripeOnboarded: !!account.details_submitted,
            stripePayoutsEnabled: !!account.payouts_enabled,
          },
        });
        break;
      }
      // handle other event types you care about (account.application.deauthorized, etc.)
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return next(error);
  }
};

export const verifyStripeAccountStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id; // Assuming you have an auth middleware
    if (!userId) throw new ValidationError("Unauthorized");

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!sellerProfile || !sellerProfile.stripeAccountId) {
      throw new ValidationError("No Stripe account connected to this profile.");
    }

    // 1. Actively ask Stripe for the live account status
    const stripeAccount = await stripe.accounts.retrieve(sellerProfile.stripeAccountId);

    // 2. Update your database immediately with the absolute truth from Stripe
    const updatedProfile = await prisma.sellerProfile.update({
      where: { id: sellerProfile.id },
      data: {
        stripeOnboarded: stripeAccount.details_submitted,
        stripePayoutsEnabled: stripeAccount.payouts_enabled,
      },
    });

    // 3. Send the result back to the frontend
    res.status(200).json({ 
      success: true, 
      stripePayoutsEnabled: updatedProfile.stripePayoutsEnabled 
    });
  } catch (error) {
    next(error);
  }
};