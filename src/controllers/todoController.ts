import { eq } from "drizzle-orm";
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { todos } from "../db/schema";
import { db } from "../db";

export async function createTodo(req: AuthRequest, res: Response) {
  try {
    const { title, description, status, dueDate } = req.body;
    const [todo] = await db
      .insert(todos)
      .values({
        userId: req.user!.userId,
        title,
        description,
        status,
        dueDate,
      })
      .returning();
    res.json(todo);
  } catch {
    res.status(500).json({ error: "Failed to create todo" });
  }
}

export async function getTodos(req: AuthRequest, res: Response) {
  const userTodos = await db
    .select()
    .from(todos)
    .where(eq(todos.userId, req.user!.userId));
  res.json(userTodos);
}

export async function updateTodo(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const updates = req.body;
  const [updated] = await db
    .update(todos)
    .set(updates)
    .where(eq(todos.id, Number(id)))
    .returning();
  res.json(updated);
}

export async function deleteTodo(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await db.delete(todos).where(eq(todos.id, Number(id)));
  res.json({ message: "Todo deleted" });
}
