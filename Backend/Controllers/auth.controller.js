import User from "../Models/user.model.js";
import {gentoken} from "../Configs/token.js";

export const googleauth = async (req, res) => {
    try{
        const { email, name } = req.body
        const safeName = name || email?.split("@")[0] || "User"
        let user = await User.findOne({ email })
        if(!user){
            user = new User({ email, name: safeName })
            await user.save()
        }
        const token = await gentoken(user._id)
        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.status(200).json({ message: "Google Auth successful", user, token })
    }catch(error){
        console.error("Error in Google Auth:", error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

export const logout = (req,res) => {
      try{
        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "strict"
        })
        return res.status(200).json({ message: "Logout successful" })
      } catch (error) {
        console.error("Error in logout:", error)
        return res.status(500).json({ message: "Internal Server Error" })
      }
}