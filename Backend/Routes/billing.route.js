import express from 'express';
import { createorder,verifyPayment } from '../Controllers/billing.controller.js';
import  isauth  from '../Middleware/isauth.js'; 


const billingrouter = express.Router()

billingrouter.post("/order",isauth,createorder)
billingrouter.post("/verify",isauth,verifyPayment)
export default billingrouter