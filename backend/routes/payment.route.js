import express from "express";
import { protectRoute } from './../middleware/auth.middleware.js';
import { createCheckoutSession, createCheckoutSuccess } from "../controllers/payment.controller.js"

const router = express.Router();

router.post("/create-checkout-session", protectRoute,createCheckoutSession);
router.post("/checkout-success", protectRoute,createCheckoutSuccess);



export default router;