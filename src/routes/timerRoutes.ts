import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import { createMode, getModes } from "../controllers/modeController";
import {
  getSessionFocusCount,
  setSessionFocusCount,
} from "../controllers/sessionFocusCountController";

const router = Router();

router.post("/", authenticateToken, createMode);
router.get("/", authenticateToken, getModes);
router.post("/session-count", authenticateToken, setSessionFocusCount);
router.get("/session-count", authenticateToken, getSessionFocusCount);
export default router;
