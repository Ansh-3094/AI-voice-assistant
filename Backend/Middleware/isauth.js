import jwt from "jsonwebtoken"

const isauth = async (req, res, next) => {
    try {
        const token =req.cookies.token

        if (!token) {
            return res.status(401).json({ message: "User has no token" })
        }

        const validtoken = jwt.verify(token, process.env.JWT_SECRET)
        const userId = validtoken?.userId || validtoken?.id || validtoken?._id

        if (!userId) {
            return res.status(401).json({ message: "User does not have a valid token" })
        }

        req.userId = userId
        next()
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export default isauth