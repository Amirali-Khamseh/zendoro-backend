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
        dueDate: dueDate ? new Date(dueDate) : null,
      })
      .returning();
    res.json(todo);
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({ error: "Failed to create todo" });
  }
}

export async function getTodos(req: AuthRequest, res: Response) {
  try {
    const userTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, req.user!.userId));
    res.json(userTodos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
}

export async function updateTodo(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Handle dueDate conversion if present
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }

    const [updated] = await db
      .update(todos)
      .set(updates)
      .where(eq(todos.id, parseInt(id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ error: "Failed to update todo" });
  }
}

export async function deleteTodo(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const result = await db.delete(todos).where(eq(todos.id, parseInt(id)));
    res.json({ message: "Todo deleted" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ error: "Failed to delete todo" });
  }
}
