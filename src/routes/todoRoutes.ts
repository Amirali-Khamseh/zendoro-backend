import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import {
  createTodo,
  deleteTodo,
  getTodos,
  updateTodo,
} from "../controllers/todoController";

const router = Router();
router.post("/", authenticateToken, createTodo);
router.get("/", authenticateToken, getTodos);
router.put("/:id", authenticateToken, updateTodo);
router.delete("/:id", authenticateToken, deleteTodo);
export default router;
