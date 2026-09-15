import express, { Router } from 'express';
import { createDiscountCodes, deleteDiscountCode, getCategories, getDiscountCodes } from '../controller/product.controller';
import { authenticate } from '@hadron/auth-handler/auth.middleware';
import { isSeller } from '@hadron/auth-handler/role.middleware';

const productRouter: Router = express.Router();

productRouter.get('/get-categories', getCategories);
productRouter.post('/create-discount-codes', authenticate, isSeller, createDiscountCodes);
productRouter.get('/get-discount-codes', authenticate, isSeller, getDiscountCodes);
productRouter.delete('/delete-discount-code/:id', authenticate, isSeller, deleteDiscountCode);

export default productRouter;
