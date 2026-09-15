import { NextFunction, Response, Request } from 'express';
import { prisma } from '@hadron/lib/prisma';
import { NotFoundError, ValidationError } from '@hadron/error-handler';

// get product categories
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const config = await prisma.site_configs.findFirst();

    if (!config) {
      return res.status(404).json({ message: 'Categories not found' });
    }

    return res.status(200).json({
      categories: config.categories,
      subCategories: config.subCategories,
    });
  } catch (error) {
    return next(error);
  }
};

//create discunt codes 
export const createDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { public_name, discountType, discountValue, discountCode } = req.body

    const isDiscountCodeExist = await prisma.discount_codes.findUnique({
      where: {
        discountCode
      }
    })

    if (isDiscountCodeExist) {
      return next(
        new ValidationError(
          "Discount code already available. please use a different code"
        )
      )
    }

    if (!req.user?.sellerProfile?.id) {
      return next(new ValidationError("Seller profile not found."));
    }

    const discount_code = await prisma.discount_codes.create({
      data: {
        public_name, 
        discountType,
        discountValue: parseFloat(discountValue),
        discountCode,
        sellerId: req.user.sellerProfile.id
      }
    })

    return res.status(201).json({
      success: true,
      discount_code
    })
  } catch (error) {
    next(error)
  }
}

// get discount codes
export const getDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.sellerProfile?.id) {
      return next(new ValidationError("Seller profile not found."));
    }

    const discount_codes = await prisma.discount_codes.findMany({
      where: {
        sellerId: req.user.sellerProfile.id
      }
    })

    return res.status(200).json({
      success: true,
      discount_codes
    })
  } catch(error) {
    next(error)
  }
}

export const deleteDiscountCode = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const sellerId = req.user?.sellerProfile?.id;
    if (!sellerId) {
      return next(new ValidationError("Seller profile not found."));
    }

    const discountCode = await prisma.discount_codes.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        sellerId: true
      }
    })

    if (!discountCode) {
      return next(new NotFoundError("Discount code not found"))
    }

    if (discountCode.sellerId !== sellerId) {
      return next(new NotFoundError("Unauthorized access"))
    }

    await prisma.discount_codes.delete({ where: { id } })

    return res.status(200).json({
      success: true,
      message: "Discount code successfully deleted"
    })
  } catch (error) {
    next(error)
  }
}