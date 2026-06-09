import jwt from 'jsonwebtoken';

export const gentoken = async(userid)=>{
        try {
            const token = jwt.sign({ userId: userid } , process.env.JWT_SECRET , {expiresIn:'7d'})
            return token
        } catch (error) {
            console.error("Error generating token:", error)
            throw new Error("Error generating token")
        }
}