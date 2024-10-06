import { singleUpload } from './../middlewares/multer.js';
import express from 'express';
import { adminOnly } from '../middlewares/auth.js';
import { deletSingleProduct, getAdminProducts, getAllProducts, getCategories, getLatestProducts, getSingleProduct, getUpdatedProduct, newProduct } from '../controllers/products.js';

const app=express.Router();

app.post('/new',adminOnly,singleUpload,newProduct);
app.get('/latest',getLatestProducts);
app.get('/categories',getCategories);
app.get('/admin-products',adminOnly,getAdminProducts);
app.get('/all',getAllProducts);
app.route('/:id').get(getSingleProduct).put(adminOnly, singleUpload,getUpdatedProduct).delete(adminOnly,deletSingleProduct);


export default app;