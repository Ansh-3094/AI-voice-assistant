import express from "express";
import { googleauth, logout } from "../Controllers/auth.controller.js";


const authrouter = express.Router()

authrouter.post("/google",googleauth)
authrouter.post("/logout",logout)

export default authrouter