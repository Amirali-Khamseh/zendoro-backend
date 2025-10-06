import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import {
  createHabit,
  deleteHabit,
  getHabits,
  updateHabit,
} from "../controllers/habitController";

const router = Router();
router.post("/", authenticateToken, createHabit);
router.get("/", authenticateToken, getHabits);
router.put("/:id", authenticateToken, updateHabit);
router.delete("/:id", authenticateToken, deleteHabit);
export default router;
