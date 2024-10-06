import { allCoupons, applyDiscount, createPayment, deleteCoupons, newCoupon } from '../controllers/payment.js';
import { adminOnly } from './../middlewares/auth.js';
import express from 'express'
const app=express.Router();

app.post('/createPayment',createPayment)

app.get('/discount',applyDiscount)

app.post('/coupon/new',adminOnly,newCoupon)

app.get('/coupon/all',adminOnly,allCoupons)

app.get('/coupon/:id',adminOnly,deleteCoupons

)
 
export default app