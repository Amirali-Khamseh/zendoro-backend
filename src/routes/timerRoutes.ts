import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import { createMode, getModes } from "../controllers/modeController";
import { sessionFocusCount } from "../controllers/sessionFocusCountController";

const router = Router();

router.post("/", authenticateToken, createMode);
router.get("/", authenticateToken, getModes);
router.post("/session-count", authenticateToken, sessionFocusCount);
export default router;
