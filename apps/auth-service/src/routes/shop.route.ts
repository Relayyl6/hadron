import { Router } from 'express';
import {
  createShop,
  getMyShop,
  updateShop,
  getShopById,
} from '../controllers/shop.controller';
import { authenticate } from '@hadron/auth-handler/auth.middleware';
import { isSeller } from '@hadron/auth-handler/role.middleware';

const shopRouter = Router();

// seller-only — manage your own shop
shopRouter.post(
  '/seller/shop',
  authenticate,
  isSeller,
  /* #swagger.tags = ['Shop'] */
  createShop,
);

shopRouter.get(
  '/seller/shop',
  authenticate,
  isSeller,
  /* #swagger.tags = ['Shop'] */
  getMyShop,
);

shopRouter.patch(
  '/seller/shop',
  authenticate,
  isSeller,
  /* #swagger.tags = ['Shop'] */
  updateShop,
);

// public — anyone can view a storefront
shopRouter.get(
  '/shops/:id',
  /* #swagger.tags = ['Shop'] */
  getShopById,
);

export default shopRouter;
