import express from 'express';
import { adminOnly } from '../middlewares/auth.js';
import { allOrder, deleteOrder, getSingleOrder, myOrder, newOrder, processOrder } from '../controllers/order.js';

const app=express.Router();

app.post('/new',newOrder);
app.get('/myOrder',myOrder);
app.get('/allOrder',adminOnly,allOrder);
app.route("/:id").get(getSingleOrder).put(adminOnly,processOrder).delete(adminOnly,deleteOrder);

export default app;