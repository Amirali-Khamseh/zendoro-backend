import { Router } from "express";
import { agentController } from "../controllers/agentController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();
router.post("/chat", authenticateToken, agentController);
export default router;
