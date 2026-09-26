import { NextFunction, Response, Request } from 'express';
import { prisma } from '@hadron/lib/prisma';
import { AuthError, NotFoundError, ValidationError } from '@hadron/error-handler';
import { client } from '@hadron/imagekit';

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

export const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { image, fileName } = req.body;

    if (!image || !fileName) {
      return res.status(400).json({ success: false, message: "Image and fileName are required" });
    }

    const response = await client.files.upload({
      file: image,       // ImageKit natively accepts base64 strings here!
      fileName: fileName,
      folder: '/products'
    });

    return res.status(200).json({
      success: true,
      data: {
        file_name: response.name, // ImageKit returns the final name as 'name'
        url: response.url,
        fileId: response.fileId
      }
    });

  } catch (error) {
    return next(error)
  }
}

export const deleteProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ 
        success: false, 
        message: "fileId is required to delete the image" 
      });
    }

    // ImageKit SDK uses client.files.delete() with the specific fileId
    await client.files.delete(fileId);

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully from ImageKit",
    });

  } catch (error) {
    // If the image doesn't exist, ImageKit might throw a 404 error here
    console.error("ImageKit Deletion Error:", error);
    return next(error);
  }
};

export const createProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      images,                 // string[]
      title,                  // string
      description,            // string (short description)
      detailed_description,   // string (HTML format)
      tags,                   // string (comma separated)
      warranty,               // string
      slug,                   // string
      brand,                  // string (optional)
      colors,                 // { name: string, hexCode: string }[] (optional)
      custom_specifications,  // { name: string, value: string }[] (optional)
      custom_properties,      // { propertyName: string, values: string[] }[] (optional)
      cash_on_delivery,       // "yes" | "no"
      categoryPath,           // string[]  <--- This handles Category AND Subcategories!
      video_url,              // string (optional)
      sale_price,             // number
      regularPrice,           // number
      stock,                  // number
      sizes,                  // string[]
      discount_codes          // string[] (manually passed from selectedDiscounts state)
    } = req.body;

    const [category, subcategory, subSubCategory] = categoryPath;

    if (!title || !slug || !description || !categoryPath || !sale_price || !images || images.length === 0 || !tags || !stock || !regularPrice) {
      return next(new ValidationError("Missing required fields"))
    }

    if (!req.user.id) {
      return next(new AuthError("Only a seller can create a product"))
    }

    const shopId = req.user?.sellerProfile?.shop?.id;

    if (!shopId) {
      return next(new ValidationError("No shop found for this seller profile."));
    }

    const slugChecking = await prisma.products.findUnique({
      where: {
        slug
      }
    })

    if (slugChecking) {
      return next(new ValidationError("Slug Already exists, please use a differernt slug"))
    }

    const product = await prisma.products.create({
      data: {
        // Basic Info
        title,
        slug,
        description,
        detailed_description,
        tags: Array.isArray(tags) ? tags : tags.split(",").map((t: string) => t.trim()),
        warranty,
        brand,
        cash_on_delivery,
        video_url,
        
        // Pricing & Inventory (Parsed to ensure correct database types)
        sale_price: parseFloat(sale_price),
        regularPrice: parseFloat(regularPrice),
        stock: parseInt(stock, 10),
        
        // Media & Variants
        images: images.filter((i: any) => i && i.fileId && i.url ).map((i: any) => ({
          file_id: i.fileId,
          url: i.url
        })),
        sizes,
        
        // Category Hierarchy
        category,
        subcategory: subcategory || null,
        subSubCategory: subSubCategory || null,
        
        // Complex Embedded Data
        colors: colors || [],
        custom_specifications: custom_specifications || [],
        custom_properties: custom_properties || [],
        
        // Discounts
        //@ts-ignore
        discount_codes: discount_codes.map((codeId) => codeId) || [],

        // Relations
        shopId: shopId
      }
    });


    return res.status(201).json({
      success: true,
      product
    })
  } catch (error) {
    return next(error)
  }
}

export const getShopProducts = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopId = req.user?.sellerProfile?.shop?.id;
    if (!shopId) {
      return res.status(200).json({
        success: true,
        products: []
      });
    }

    const products = await prisma.products.findMany({
      where: {
        shopId: shopId
      }
    })

    return res.status(200).json({
      success: true,
      products
    })
  } catch (error) {
    return next(error)
  }
}

export const deleteProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user?.sellerProfile?.shop?.id;

    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: { id: true, shopId: true, isDeleted: true }
    })

    if (!product) {
      return next(new ValidationError("Product Not Found"))
    }

    console.log("product.shopId:", product.shopId, "sellerId:", sellerId); if (product.shopId !== sellerId) {
      return next(new AuthError("Unauthorized action"))
    }

    if (product.isDeleted) {
      return next(new ValidationError("Product is already deleted"))
    }

    const deletedProduct = await prisma.products.update({
      where: { id: productId },
      data: {
        isDeleted: true,
        deletedAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    })

    return res.status(200).json({
      message: "Product is scheduled for deletion in 24 hours. You can restore it within this tine frame",
      deletedAt: deletedProduct.deletedAt
    })

  } catch (error) {
    return next(error)
  }
}

export const restoreProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user?.sellerProfile?.shop?.id;

    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: { id: true, shopId: true, isDeleted: true }
    })

    if (!product) {
      return next(new ValidationError("Product Not Found"))
    }

    console.log("product.shopId:", product.shopId, "sellerId:", sellerId); if (product.shopId !== sellerId) {
      return next(new AuthError("Unauthorized action"))
    }

    if (!product.isDeleted) {
      return res.status(400).json({
        message: "Product is not in deleted state"
      })
    }

    await prisma.products.update({
      where: { id: productId },
      data: { isDeleted: false, deletedAt: null }
    })

    return res.status(200).json({
      message: "Product successfully restored",
    })

  } catch (error) {
    return next(error)
  }
}
