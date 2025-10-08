import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import { createMode, getModes } from "../controllers/modeController";

const router = Router();

router.post("/", authenticateToken, createMode);
router.get("/", authenticateToken, getModes);
export default router;
