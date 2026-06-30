import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import {
  createGoal,
  deleteGoal,
  getGoals,
  updateGoal,
} from "../controllers/goalController";

const router = Router();
router.post("/", authenticateToken, createGoal);
router.get("/", authenticateToken, getGoals);
router.put("/:id", authenticateToken, updateGoal);
router.delete("/:id", authenticateToken, deleteGoal);
export default router;
