import express from "express";
import { addToCart, getCartProducts, reomveAllProducts, updateQuantity } from "../controllers/cart.controller.js"
import { protectRoute } from './../middleware/auth.middleware.js';

const router = express.Router();


router.get("/", protectRoute, getCartProducts);
router.post("/", protectRoute, addToCart);
router.delete("/", protectRoute, reomveAllProducts);
router.put("/:id", protectRoute,updateQuantity);





export default router;