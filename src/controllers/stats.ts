import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { calculatePercentage,getChartData,getInventories } from "../utils/features.js";

export const getDashBoardState = TryCatch(async (req, res, next) => {
  let stats = {};

  if (myCache.has("admin-stats"))
    stats = JSON.parse(myCache.get("admin-stats") as string);
  else {
    const today = new Date();
    const sixMonthAgo = new Date();
    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

    const thisMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };

    const lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };

    const thisMonthProduct = Product.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastMonthProduct = Product.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthUser = User.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastMonthUser = User.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthOrder = Order.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastMonthOrder = Order.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const lastSixMonthOrder = Order.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lte: today,
      },
    });

   const latestTransaction=Order.find({}).select(["orderItems","discount","total","status"]).limit(4)


    const [
      thisMonthProducts,
      lastMonthProducts,
      thisMonthUsers,
      lastMonthUsers,
      thisMonthOrders,
      lastMonthOrders,
      productCount,
      userCount,
      allOrders,
      lastSixMonthOrders,
      categories,
      femaleUserCount,
      latestTransactions
    ] = await Promise.all([
      thisMonthProduct,
      lastMonthProduct,
      thisMonthUser,
      lastMonthUser,
      thisMonthOrder,
      lastMonthOrder,
      Product.countDocuments(),
      User.countDocuments(),
      Order.find({}).select("total"),
      lastSixMonthOrder,
      Product.distinct('category'),
      User.countDocuments({gender: 'female'}),
      latestTransaction
    ]);

    const userChangePercentage = calculatePercentage(
      thisMonthUsers.length,
      lastMonthUsers.length
    );

    const productChangePercentage = calculatePercentage(
      thisMonthProducts.length,
      lastMonthProducts.length
    );

    const orderChangePercentage = calculatePercentage(
      thisMonthOrders.length,
      lastMonthOrders.length
    );

    const thisMonthRevenue = thisMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );
    const lastMonthRevenue = lastMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const revenueChangePercentage = calculatePercentage(
      thisMonthRevenue,
      lastMonthRevenue
    );    


    const changePercent={
      revenue:revenueChangePercentage,
      product:productChangePercentage,
      user:userChangePercentage,
      order:orderChangePercentage
    }
    const revenue = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const count = {
      user: userCount,
      product: productCount,
      order: allOrders.length,
      revenue
    };

    const orderMonthCounts = new Array(6).fill(0);
    const orderMonthRevenue = new Array(6).fill(0);
    
    lastSixMonthOrders.forEach((order) => {
      const creationDate = order.createdAt;
      const monthDiff = (today.getMonth() - creationDate.getMonth()+12)%12;
      if (monthDiff < 6) {
        orderMonthCounts[6 - monthDiff - 1] += 1;
        orderMonthRevenue[6 - monthDiff - 1] += order.total;
      }
    }); 


const categoryCount=await getInventories({categories,productCount});

const userRatio={
  male:userCount-femaleUserCount,
  female:femaleUserCount
}

const modifyTransaction=latestTransactions.map((i)=>({
  _id:i._id,
  discount:i.discount,
  amount:i.total,
  quantity:i.orderItems.length,
  status:i.status,
}))

    stats = {
     latestTransaction: modifyTransaction,
      userRatio,
      categoryCount,
      categories,
      changePercent,
      count,
     
      chart: {
        order: orderMonthCounts,
        revenue: orderMonthRevenue,
      },
      
    };
    myCache.set('admin-stats',JSON.stringify(stats));
  }
  return res.status(200).json({
    success: true,
    stats,
  });
});


export const getPieCharts=TryCatch(async (req,res,next)=>{

  let charts;

  if(myCache.has('admin-pie-charts')) charts=JSON.parse(myCache.get('admin-pie-charts') as string);

else{

const [processingOrder,ShippedOrder,DeliveredOrder,categories,productCount,productOutStock,allOrders,allUsers,adminUsers,customersUser]=await Promise.all([Order.countDocuments({status:"Processing"}),Order.countDocuments({status:"Shipped"}),Order.countDocuments({status:"Delivered"}),Product.distinct('category'),Product.countDocuments(),Product.countDocuments({stock:0}),Order.find({}).select(["total","discount","subtotal","tax","shippingCharges"]),User.find({}).select(["dob"]),User.countDocuments({role:"admin"}),User.countDocuments({role:"user"})])

const orderFulFillment={
  processing:processingOrder,
  shipped:ShippedOrder,
  delivery:DeliveredOrder,
}

const productCategories=await getInventories({categories,productCount});

const stockAvailability={
  inStock:productCount-productOutStock,
  productOutStock,
}



const GrossIncome=allOrders.reduce((prev,order)=>prev+(order.total||0),0)

const discount=allOrders.reduce((prev,order)=>prev+(order.discount||0),0)

const productionCost=allOrders.reduce((prev,order)=>prev+(order.shippingCharges||0),0)

const burnt=allOrders.reduce((prev,order)=>prev+(order.tax||0),0)

const marketingCost=Math.round(GrossIncome*(30/100))

const netMargin=GrossIncome-discount-productionCost-burnt-marketingCost;

const revenueDistribution={
  netMargin,
discount,
productionCost,
marketingCost,
burnt,

}

const userAgeGroup={
  teen:allUsers.filter((i)=>i.age<=20).length,
  adult:allUsers.filter((i)=> i.age>20 && i.age<=40).length,
  old:allUsers.filter((i)=>i.age>40).length,
}


const adminCustomer={
  admin:adminUsers,
  customer:customersUser
}


charts={
  orderFulFillment,
  productCategories,
  stockAvailability,
  revenueDistribution,
  adminCustomer,
  userAgeGroup
}

myCache.set('admin-pie-charts',JSON.stringify(charts))
 

}
return res.status(200).json({
  success: true,
  charts,
});
})

export const getBarCharts=TryCatch(async (req,res,next)=>{

let charts;

const key="admin-bar-charts";

if(myCache.has(key)) charts=JSON.parse(myCache.get(key) as string)

else{
  const today = new Date();
  const sixMonthAgo = new Date();
  sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

  const twelveMonthAgo = new Date();
  twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);

  const lastSixMonthProduct = Product.find({
    createdAt: {
      $gte: sixMonthAgo,
      $lte: today,
    },
  }).select('createdAt')

  const lastSixMonthUser = User.find({
    createdAt: {
      $gte: sixMonthAgo,
      $lte: today,
    },
  }).select('createdAt')

  const twelveSixMonthOrder = Order.find({
    createdAt: {
      $gte: twelveMonthAgo,
      $lte: today,
    },
  }).select('createdAt')
  
const [products,users,order]=await Promise.all([lastSixMonthProduct,lastSixMonthUser,twelveSixMonthOrder])

const productCounts=getChartData({length:6,docArr:products,today})
const userCounts=getChartData({length:6,docArr:users,today})
const orderCounts=getChartData({length:12,docArr:order,today})

charts={
users:userCounts,
products:productCounts,
order:orderCounts
}

myCache.set(key,JSON.stringify(charts))

}
return res.status(200).json({
  success: true,
  charts
});

})

export const getLineCharts=TryCatch(async (req,res,next)=>{

  let charts;
  
  const key="admin-line-charts";
  
  if(myCache.has(key)) charts=JSON.parse(myCache.get(key) as string)
  
  else{
    const today = new Date();
    
    const twelveMonthAgo = new Date();
    twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);
  
    const twelveMonthProduct = Product.find({
      createdAt: {
        $gte: twelveMonthAgo,
        $lte: today,
      },
    }).select('createdAt')

    const twelveMonthUser = User.find({
      createdAt: {
        $gte: twelveMonthAgo,
        $lte: today,
      },
    }).select('createdAt')
    
    const twelveMonthOrder = Order.find({
      createdAt: {
        $gte: twelveMonthAgo,
        $lte: today,
      },
    }).select(['createdAt','discount','total'])
    
  const [products,users,order]=await Promise.all([twelveMonthProduct,twelveMonthUser,twelveMonthOrder])
  
  const productCounts=getChartData({length:12,docArr:products,today})
  const userCounts=getChartData({length:12,docArr:users,today})
  const discount=getChartData({length:12,docArr:order,today,property:'discount'})
  const revenue=getChartData({length:12,docArr:order,today,property:'total'})
  
  charts={
  users:userCounts,
  products:productCounts,
 discount,
 revenue
  }
  
  myCache.set(key,JSON.stringify(charts))
  
  }
  return res.status(200).json({
    success: true,
    charts
  });
  
  })