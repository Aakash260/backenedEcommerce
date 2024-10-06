import express from 'express'
import morgan from 'morgan'
import userRoutes from "./routes/user.js"
import { connectDB } from './utils/features.js';
import { errorMiddleware } from './middlewares/error.js';
import productRoute from './routes/products.js'
import orderRoute from './routes/order.js'
import paymentRoute from './routes/payment.js'
import NodeCache from 'node-cache';
import statisRoute from './routes/stats.js'
import { config } from 'dotenv';
import Stripe from 'stripe';
import cors from "cors" 

const stripeKey=process.env.STRIPE_KEY || "";
 
export const stripe=new Stripe('sk_test_51PQUo5P1nLJuBnJX38QJ1msConb00apn9Jsm0Pr4UvHLogBrLOAhMM3vUPXAshQ04YfNjTSw8TlHdpoJeA38jgZt0013VXW7RB')
export const myCache=new NodeCache();

const app = express();
config()
connectDB(process.env.MONGO_URL||"");
app.use(cors())
app.use(express.json());
app.use(morgan("dev"));

app.use('/api/v1/user',userRoutes)
app.use('/api/v1/product',productRoute)
app.use('/api/v1/order',orderRoute)
app.use('/api/v1/payment',paymentRoute)
app.use('/api/v1/stats',statisRoute)

app.get('/', (req, res) => {
    res.send("API Working")
})
app.use('/uploads',express.static('uploads'))
app.use(errorMiddleware) 


app.listen(process.env.PORT,()=>{
console.log(`server started at ${process.env.PORT}`);
});
