import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import {
  createMode,
  deleteMode,
  getModes,
} from "../controllers/modeController";

const router = Router();

router.post("/", authenticateToken, createMode);
router.get("/", authenticateToken, getModes);
router.delete("/:id", authenticateToken, deleteMode);
export default router;
