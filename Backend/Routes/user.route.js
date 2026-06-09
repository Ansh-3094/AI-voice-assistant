import express from "express";
import isauth from "../Middleware/isauth.js"
import { createBillingOrder, getcurruser, getWidgetConfig, saveassistant, verifyBillingPayment, voiceWidgetScript } from "../Controllers/user.controller.js";

const userrouter = express.Router();

userrouter.get("/widget/voice-agent.js", voiceWidgetScript)
userrouter.get("/widget/:userId", getWidgetConfig)
userrouter.get("/current-user" , isauth , getcurruser)
userrouter.post("/save-assistant" , isauth , saveassistant)



export default userrouter