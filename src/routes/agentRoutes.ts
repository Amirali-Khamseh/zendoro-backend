import { Router } from "express";
import { agentController } from "../controllers/agentController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { agentRateLimiter } from "../middlewares/rateLimitMiddleware";

const router = Router();
router.post("/chat", authenticateToken, agentRateLimiter, agentController);
export default router;
