import { GoogleGenAI } from "@google/genai";
import { Router } from "express";
import { agentController } from "../controllers/agentController";

const router = Router();

router.get("/", agentController);
export default router;
