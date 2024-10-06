import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/product.js";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import { Request } from "express";
import ErrorHandler from "../utils/utility-class.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { invalidateCache } from "../utils/features.js";
// import { faker } from "@faker-js/faker";

export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, category, price, stock } = req.body;
    const photo = req.file;
    if (!photo) return next(new ErrorHandler("Please Add Photo", 400));

    if (!name || !category || !price || !stock) {
      rm(photo.path, () => {
        console.log("photo deleted");
      });

      return next(new ErrorHandler("Please Add Fild", 400));
    }

    await Product.create({
      name,
      category: category.toLowerCase(),
      price,
      stock,
      photo: photo?.path,
    });
     invalidateCache({product:true,admin:true})
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
    });
  }
);

// revalidate om new,update,delete and order
export const getLatestProducts = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    let products;

    if (myCache.has("latest-products"))
      products = JSON.parse(myCache.get("latest-products") as string);
    else {
      products = await Product.find({})
        .sort({
          createdAt: -1,
        })
        .limit(5);
        myCache.set("latest-products", JSON.stringify(products));
    }

    return res.status(201).json({
      success: true,
      products,
    });
  }
);

// revalidate om new,update,delete and order
export const getCategories = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    let categories;
    if (myCache.has("categories"))
      categories = JSON.parse(myCache.get("categories") as string);
    else {
      categories = await Product.distinct("category");
      myCache.set("categories", JSON.stringify(categories));
    }
    return res.status(201).json({
      success: true,
      categories,
    });
  }
);

export const getAdminProducts = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    let products;
    if (myCache.has("all-products"))
      products = JSON.parse(myCache.get("all-products") as string);
    else {
      products = await Product.find({});
      myCache.set("all-products", JSON.stringify(products));
    }

    return res.status(201).json({
      success: true,
      products,
    });
  }
);

export const getSingleProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    let product;
    const { id } = req.params as { id: string };
    if (myCache.has(`product-${id}`))
      product = JSON.parse(myCache.get(`product-${id}`) as string);
    else {
      product = await Product.findById(id);
      if (!product) return next(new ErrorHandler("Product not found", 404));
      myCache.set(`product-${id}`, JSON.stringify(product));
    }
    return res.status(201).json({
      success: true,
      product,
    });
  }
);

export const getUpdatedProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { id } = req.params as { id: string };
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    const product = await Product.findById(id);
    if (!product) {
      return next(new ErrorHandler("Invalid Id", 404));
    }
    if (photo) {
      rm(product.photo!, () => {
        console.log("old photo Deleted");
      });
      product.photo = photo.path;
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (category) product.category = category;

    await product.save();
     invalidateCache({product:true,productId:String(product._id),admin:true})
    return res.status(201).json({
      success: true,
      message: "Product upload successfully",
    });
  }
);

export const deletSingleProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { id } = req.params as { id: string };
    const product = await Product.findById(id);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    rm(product.photo!, () => {
      console.log(`Product Photo Deleted`);
    });

    await product.deleteOne();
     invalidateCache({product:true,productId:String(product._id),admin:true})

    return res.status(201).json({
      success: true,
      message: "Product delete successfully",
    });
  }
);

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = limit * (page - 1);

    const baseQuery: BaseQuery = {};

    if (search) {
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (price) {
      baseQuery.price = {
        $lte: Number(price),
      };
    }

    if (category) baseQuery.category = category;

    const ProductPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [product, allFilteredProducts] = await Promise.all([
      ProductPromise,
      Product.find(baseQuery),
    ]);

    const totalPage = Math.ceil(allFilteredProducts.length / limit);

    return res.status(200).json({
      success: true,
      product,
      totalPage,
    });
  }
);

// const generateRandomProduct = async (count: number = 10) => {
//   const products = [];

//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       photo: "uploads\\79d98fa2-d9ec-4d90-bf23-8a8341777298.png",
//       price: faker.commerce.price({ min: 1500, max: 150000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       __v: 0,
//     };
//     products.push(product);
//   }
//   await Product.create(products);
// };
// generateRandomProduct(40)
// const deleteRandomProduct = async (count: number = 10) => {
//   const products = await Product.find({}).skip(2);

//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await product.deleteOne();
//   }
// };

// deleteRandomProduct(38);

