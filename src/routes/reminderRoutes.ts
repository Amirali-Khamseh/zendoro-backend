import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import {
  createReminder,
  deleteReminder,
  getReminders,
  updateReminder,
} from "../controllers/reminderController";

const router = Router();
router.post("/", authenticateToken, createReminder);
router.get("/", authenticateToken, getReminders);
router.put("/:id", authenticateToken, updateReminder);
router.delete("/:id", authenticateToken, deleteReminder);
export default router;
