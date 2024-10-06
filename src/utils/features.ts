import mongoose from "mongoose";
import { InvalidateCacheProps, orderItemsType } from "../types/types.js";
import { myCache } from "../app.js";
import { Product } from "../models/product.js";
import { Order } from "../models/order.js";

export const connectDB = (url: string) => {
  mongoose
    .connect(url, {
      dbName: "Ecommerce_24",
    })
    .then((c) => {
      console.log(`Connected to database ${c.connection.host}`);
    })
    .catch((err) => console.log(err));
};

export const invalidateCache = async ({
  product,
  order,
  admin,
  userId,
  orderId,
  productId,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "all-products",
      "categories",
      `product-${productId}`,
    ];
    if (typeof productId === "string") productKeys.push(`product-${productId}`);
    if (typeof productId === "object")
      productId.forEach((i) => productKeys.push(`product-${i}`));
    myCache.del(productKeys);
  }
  if (order) {
    const orderKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];

    myCache.del(orderKeys);
  }
  if (admin) {
    myCache.del(['admin-stats','admin-pie-charts','admin-line-charts','admin-bar-charts'])
  }
};

export const reduceOrderedStock = async (orderItems: orderItemsType[]) => {
  for (let index = 0; index < orderItems.length; index++) {
    const order = orderItems[index];
    const product = await Product.findById(order.productId);
    if (!product) {
      throw new Error(`product not found`);
    } else {
      product.stock -= order.quantity;
      await product.save();
    }
  }
};

export const calculatePercentage=(thisMonth:number,lastMonth:number)=>{

  if(lastMonth===0) return thisMonth*100;

  const percentage=(thisMonth/lastMonth)*100;
return Number(percentage.toFixed(0));
}


export const getInventories=async ({categories,productCount}:{categories:string[],productCount:number})=>{
  const categoriesCountPromise=categories.map((category)=>Product.countDocuments({category}));

const categoriesCount=await Promise.all(categoriesCountPromise)
   
const categoryCount: Record<string,number>[]=[];

categories.forEach((category,ind)=>{
   categoryCount.push({
      [category]:Math.round((categoriesCount[ind]/productCount)*100),
   })
})
return categoryCount
}

interface MyDocument extends Document {
  createdAt:Date
}

type funcProps={length:number,docArr:any,today:Date,property?:string}

export const getChartData=({length,docArr,today,property}:funcProps)=>{
  const data = new Array(length).fill(0);
 
  docArr.forEach((i:any) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth()+12)%12;
    if (monthDiff < length) {
      if(property){

        data[length - monthDiff - 1] += i[property];
      }else{
        data[length - monthDiff - 1] +=1
      }
    }
  }); 
  return data;
}