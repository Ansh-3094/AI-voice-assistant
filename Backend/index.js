import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import ConnectDB from './Configs/ConnectDB.js';
import authrouter from "./Routes/auth.route.js"
import userrouter from './Routes/user.route.js';
import billingrouter from './Routes/billing.route.js';
import assistantrouter from './Routes/assistant.route.js';

dotenv.config()

const app = express()
const port = process.env.PORT || 5000


// Creating a middleware
app.use(express.json())
app.use(cookieParser())
const privatecors = cors({
    origin:["http://localhost:5173"],
    credentials: true
})
const publiccors = cors({
    origin:"*"
})
app.use("/api/auth",privatecors,authrouter)
app.use("/api/user",privatecors,userrouter)
app.use("/api/assistant",publiccors,assistantrouter)
app.use("/api/billing",privatecors,billingrouter)


app.get("/" , (req,res) => {
     res.send("<h1>Hello World</h1>")
})  

const startServer = async () => {
    try {
        await ConnectDB()
        app.listen(port , ()=> {
            console.log(`Server is running on port ${port}`)
        })
    } catch (error) {
        console.error("Server failed to start:", error)
        process.exit(1)
    }
}

startServer()