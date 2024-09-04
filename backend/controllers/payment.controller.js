import { stripe } from '../lib/stripe.js';
import Coupon from './../model/coupon.model.js';
import Order from './../model/order.model.js';


export const createCheckoutSession = async (req,res) => {
    try {
        const { products,couponCode } = req.body;
        if(!Array.isArray(products) || products.length === 0){
            return res.status(400).json({ error: "Invalid or empty products array" });
        }

        let totalAmount = 0;
        
        const lineItems = products.map( product => {
            // stripe want you to send in the format of cents
            const amount = Math.round(product.price * 100);
            totalAmount += amount * product.quantity;
            
            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        image: [product.image],
                    },

                },
                unit_amount: amount
            }
        });
        
        let coupon = null;
        if(couponCode){
            coupon = await Coupon.findOne({ code:couponCode,userId:req.user._id, isActive:true });
            if(coupon){
                totalAmount -= Math.round( totalAmount * coupon.discountPercentage / 100);
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card",],
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
            discounts: coupon ? [
                {
                    coupon: await createStripeCoupon(coupon.discountPercentage)
                }
            ]: [],
            metadata: {
                userId: req.user._id.toString(),
                couponCode: couponCode || "",
                products: JSON.stringify(
                    products.map((p) => ({
                        id: p._id,
                        quantity: p.quantity,
                        price: p.price,
                    }))
                )
            }
        })
        if(totalAmount >= 10000){
            await createNewCoupon(req.user._id)
        }
        res.status(200).json({ id: session.id,totalAmount: totalAmount/100 });
    } catch (error) {
        console.log("Error in createCheckoutSession controller", error.message);
        res.status(500).json({
            message:"Server Error", error: error.message 
        })  
    }


}

export const createCheckoutSuccess = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if( session.payment_status === "paid"){
            if( session.metadata.couponCode) {
                await Coupon.findOneAndUpdate({
                    code: session.metadata.couponCode,
                    userId: session.metadata.userId
                },{
                    isActive: false
                })
            }
            // new order is creating
            const products = JSON.parse(session.metadata.products);
            const newOrder = new Order({
                user: session.metadata.userId,
                products: products.map(product => ({
                    product: product.id,
                    quantity: product.quantity,
                    price: product.price
                })),
                totalAmount: session.amount_total / 100,
                stripeSessionId: sessionId
            })

            await newOrder.save();
            res.json({ 
                success: true,
                message: "success",
                orderId: newOrder._id,
            });
        }


    } catch (error) {
        console.log("Error in createCheckoutSuccess controller", error.message);
        res.status(500).json({
            message:"Error processing successfull checkout", error: error.message 
        })      
    }
}










async function createStripeCoupon(discountPercentage) {
    const coupon = await stripe.coupons.create({
        percent_off: discountPercentage,
        duration: "once"
    })
    return coupon.id;
}

async function createNewCoupon(userId){
    const newCoupon = new Coupon({
        code: "GIFT" + Math.random().toString(36).substring(2,8).toUpperCase(),
        discountPercentage:10,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userId: userId
    })

    await newCoupon.save();
    return newCoupon;
}