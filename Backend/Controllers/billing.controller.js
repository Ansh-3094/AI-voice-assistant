import User from '../Models/user.model.js'
import Billing from '../Models/billing.model.js'
import { instance } from '../Configs/razorpay.js'
import crypto from 'crypto'
export const createorder = async (req,res)=>{
        try{
            if (!req.userId) {
                return res.status(401).json({ success: false, message: "Unauthorized user" })
            }

            const { plan = "pro" } = req.body || {}
            const userid = req.userId

            let amount = 499
            if(plan === "enterprise"){
                amount = 999
            }

            const order = await instance.orders.create({
                amount: amount * 100,
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
                notes: {
                    userid: String(userid),
                    plan,
                },
            })
            await Billing.create({
                userid,
                amount,
                plan,
                orderid: order.id,
            })
           return res.status(200).json({ success: true, order });
        }catch(error){
            console.error("Error creating order:", error);
            return res.status(500).json({ success: false, message: "Error creating order" });
        }
}

export const verifyPayment = async (req,res)=>{
    try{
        if (!req.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized user" })
        }

        const { orderid, paymentid, razorpay_signature } = req.body || {}
        const billingRecord = await Billing.findOne({ orderid })
        if(!billingRecord){
            return res.status(404).json({ success: false, message: "Billing record not found" })
        }

        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${orderid}|${paymentid}`)
            .digest('hex')

        if (generatedSignature !== razorpay_signature) {
            billingRecord.status = "failed"
            billingRecord.paymentid = paymentid
            await billingRecord.save()
            return res.status(400).json({ success: false, message: "Invalid payment signature" })
        }

        billingRecord.status = "completed"
        billingRecord.paymentid = paymentid
        await billingRecord.save()

        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        user.plan = "pro"
        user.requestlimit = 1000
        user.proexpireat = new Date(Date.now() + 30*24*60*60*1000)
        user.geministatus = "active"
        user.issetupcomplete = true
        await user.save()

        return res.status(200).json({ success: true, message: "Subscription activated successfully", user })

    }
    catch(error){
        console.error("Error verifying payment:", error);
        return res.status(500).json({ success: false, message: "Error verifying payment" });
    }
}