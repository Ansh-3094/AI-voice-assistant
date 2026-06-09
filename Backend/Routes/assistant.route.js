import express from 'express';
import { chatAssistant, getAssistantConfig,askassistant } from '../Controllers/assistant.controller.js';

const assistantrouter = express.Router();

assistantrouter.get("/config/:userId", getAssistantConfig);
assistantrouter.post("/chat/:userId", chatAssistant);
assistantrouter.post("/ask",askassistant);



export default assistantrouter