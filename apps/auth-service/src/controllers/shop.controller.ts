import { Request, Response, NextFunction } from 'express';
import { prisma } from '@hadron/lib/prisma';
import { ValidationError, NotFoundError } from '@hadron/error-handler';

// ---- POST /seller/shop ----
export const createShop = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ValidationError('Unauthorized');

    const {
      name,
      bio,
      category,
      coverBanner,
      address,
      opening_hours,
      website,
      socialLinks,
    } = req.body;

    if (!name || !address) {
      throw new ValidationError('Shop name and address are required.');
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });
    if (!sellerProfile) throw new ValidationError('Seller profile not found');

    // for business logic, this is terrible practise for th eonboarding
    // if (!sellerProfile.stripePayoutsEnabled) {
    //   throw new ValidationError("Complete Stripe payout setup before creating a shop.");
    // }

    // one seller, one shop — don't let them silently create a second
    const existingShop = await prisma.shops.findUnique({
      where: { sellerProfileId: sellerProfile.id },
    });
    if (existingShop) {
      throw new ValidationError('You already have a shop.');
    }

    const shop = await prisma.shops.create({
      data: {
        name,
        bio,
        category,
        coverBanner,
        address,
        opening_hours,
        website,
        socialLinks: socialLinks ?? [],
        sellerProfileId: sellerProfile.id,
      },
    });

    res.status(201).json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

// ---- GET /seller/shop ----  (the logged-in seller's own shop)
export const getMyShop = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ValidationError('Unauthorized');

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: { shop: { include: { avatar: true, reviews: true } } },
    });
    if (!sellerProfile) throw new ValidationError('Seller profile not found');
    if (!sellerProfile.shop)
      throw new NotFoundError("You haven't created a shop yet.");

    res.status(200).json({ success: true, shop: sellerProfile.shop });
  } catch (error) {
    next(error);
  }
};

// ---- PATCH /seller/shop ----
export const updateShop = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ValidationError('Unauthorized');

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: { shop: true },
    });
    if (!sellerProfile) throw new ValidationError('Seller profile not found');
    if (!sellerProfile.shop)
      throw new NotFoundError("You haven't created a shop yet.");

    // whitelist updatable fields — never trust req.body wholesale on an update
    const {
      name,
      bio,
      category,
      coverBanner,
      address,
      opening_hours,
      website,
      socialLinks,
    } = req.body;

    const updated = await prisma.shops.update({
      where: { id: sellerProfile.shop.id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(category !== undefined && { category }),
        ...(coverBanner !== undefined && { coverBanner }),
        ...(address !== undefined && { address }),
        ...(opening_hours !== undefined && { opening_hours }),
        ...(website !== undefined && { website }),
        ...(socialLinks !== undefined && { socialLinks }),
      },
    });

    res.status(200).json({ success: true, shop: updated });
  } catch (error) {
    next(error);
  }
};

// ---- GET /shops/:id ----  (public storefront view)
export const getShopById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const shop = await prisma.shops.findUnique({
      where: { id },
      include: { avatar: true, reviews: true },
    });

    if (!shop) throw new NotFoundError('Shop not found');

    res.status(200).json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};
