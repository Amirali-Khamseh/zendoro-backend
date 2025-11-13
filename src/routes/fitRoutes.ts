import { Router } from "express";
import { storeTokens, getSteps, quickDaily } from "../controllers/fitController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.post("/tokens", storeTokens);
router.get("/steps", authenticateToken, getSteps);
router.post("/daily", authenticateToken, quickDaily);

export default router;
