import express, { Router } from 'express';
import { 
    createDiscountCodes, 
    createProduct, 
    deleteDiscountCode, 
    deleteProduct, 
    deleteProductImage, 
    getCategories, 
    getDiscountCodes, 
    getShopProducts, 
    restoreProduct, 
    uploadProductImage 
} from '../controller/product.controller';
import { authenticate } from '@hadron/auth-handler/auth.middleware';
import { isSeller } from '@hadron/auth-handler/role.middleware';

const productRouter: Router = express.Router();

productRouter.get('/get-categories', getCategories);
productRouter.post('/create-discount-codes', authenticate, isSeller, createDiscountCodes);
productRouter.get('/get-discount-codes', authenticate, isSeller, getDiscountCodes);
productRouter.delete('/delete-discount-code/:id', authenticate, isSeller, deleteDiscountCode);
// upload-product-image
productRouter.post('/upload-product-image', authenticate, isSeller, uploadProductImage);
// delete-product-image
productRouter.delete('/delete-product-image', authenticate, isSeller, deleteProductImage);
productRouter.post('/create-product', authenticate, isSeller, createProduct)
productRouter.get('/get-shop-products', authenticate, isSeller, getShopProducts)

productRouter.delete('/delete-product/:productId', authenticate, isSeller, deleteProduct)
productRouter.put('/restore-product/:productId', authenticate, isSeller, restoreProduct)

export default productRouter;
