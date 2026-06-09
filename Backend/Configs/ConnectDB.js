import mongoose from "mongoose"

const ConnectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("MongoDB Connected")
    } catch (error) {
        console.error("Error connecting to MongoDB:", error)
        throw error
    }
}

export default ConnectDB