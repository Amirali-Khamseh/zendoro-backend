import { db } from "../db";
import { reminders, todos, habits, modes } from "../db/schema";
import { eq, and } from "drizzle-orm";
import type { AuthRequest } from "../middlewares/authMiddleware";

// Gemini function declarations for tool calling
export const functionDeclarations = [
  {
    name: "get_todos",
    description:
      "Fetch the authenticated user's todos. Optionally filter by status. Returns a list of todo items with id, title, description, status, and dueDate.",
    parameters: {
      type: "OBJECT",
      properties: {
        status: {
          type: "STRING",
          description:
            "Optional status filter. One of: TODO, In Progress, Done, Kill",
        },
      },
    },
  },
  {
    name: "create_todo",
    description:
      "Create a new todo item for the user. Returns the created todo with all fields.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: {
          type: "STRING",
          description: "The title of the todo item",
        },
        description: {
          type: "STRING",
          description: "Detailed description of the todo",
        },
        status: {
          type: "STRING",
          description: "Status: TODO, In Progress, Done, or Kill",
        },
        dueDate: {
          type: "STRING",
          description:
            "Optional due date in ISO 8601 format (e.g., 2025-10-20T10:00:00)",
        },
      },
      required: ["title", "description", "status"],
    },
  },
  {
    name: "update_todo",
    description:
      "Update an existing todo item by ID. Can update title, description, status, or dueDate.",
    parameters: {
      type: "OBJECT",
      properties: {
        id: {
          type: "INTEGER",
          description: "The ID of the todo to update",
        },
        title: {
          type: "STRING",
          description: "New title for the todo",
        },
        description: {
          type: "STRING",
          description: "New description",
        },
        status: {
          type: "STRING",
          description: "New status: TODO, In Progress, Done, or Kill",
        },
        dueDate: {
          type: "STRING",
          description: "New due date in ISO 8601 format",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_todo",
    description: "Delete a todo item by ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        id: {
          type: "INTEGER",
          description: "The ID of the todo to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_reminders",
    description:
      "Fetch the authenticated user's reminders. Returns a list with id, title, description, date, time, priority, and completed status.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "create_reminder",
    description:
      "Create a new reminder for the user with a title, description, date, time, and priority level.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: {
          type: "STRING",
          description: "The title of the reminder",
        },
        description: {
          type: "STRING",
          description: "Detailed description of the reminder",
        },
        date: {
          type: "STRING",
          description: "Date in format YYYY-MM-DD (e.g., 2025-10-20)",
        },
        time: {
          type: "STRING",
          description: "Time in format HH:MM (e.g., 14:30)",
        },
        priority: {
          type: "STRING",
          description: "Priority level: low, medium, or high",
          enum: ["low", "medium", "high"],
        },
      },
      required: ["title", "description", "date", "time", "priority"],
    },
  },
  {
    name: "update_reminder",
    description:
      "Update an existing reminder by ID. Can update any field including marking it as completed.",
    parameters: {
      type: "OBJECT",
      properties: {
        id: {
          type: "INTEGER",
          description: "The ID of the reminder to update",
        },
        title: {
          type: "STRING",
          description: "New title",
        },
        description: {
          type: "STRING",
          description: "New description",
        },
        date: {
          type: "STRING",
          description: "New date (YYYY-MM-DD)",
        },
        time: {
          type: "STRING",
          description: "New time (HH:MM)",
        },
        priority: {
          type: "STRING",
          description: "New priority: low, medium, or high",
        },
        completed: {
          type: "BOOLEAN",
          description: "Mark as completed (true) or incomplete (false)",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_reminder",
    description: "Delete a reminder by ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        id: {
          type: "INTEGER",
          description: "The ID of the reminder to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_habits",
    description:
      "Fetch the authenticated user's habits. Returns habits with id, name, and completions array (7 booleans for each weekday).",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "create_habit",
    description:
      "Create a new habit for the user with a name and completion tracking for each day of the week.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: {
          type: "STRING",
          description: "The name of the habit",
        },
        completions: {
          type: "ARRAY",
          description:
            "Array of 7 boolean values representing completion status for each weekday (Monday-Sunday)",
          items: {
            type: "BOOLEAN",
          },
        },
      },
      required: ["name", "completions"],
    },
  },
  {
    name: "update_habit",
    description:
      "Update an existing habit by ID. Can update the name or completions array.",
    parameters: {
      type: "OBJECT",
      properties: {
        id: {
          type: "INTEGER",
          description: "The ID of the habit to update",
        },
        name: {
          type: "STRING",
          description: "New habit name",
        },
        completions: {
          type: "ARRAY",
          description: "New completions array (7 booleans)",
          items: {
            type: "BOOLEAN",
          },
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_habit",
    description: "Delete a habit by ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        id: {
          type: "INTEGER",
          description: "The ID of the habit to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_modes",
    description:
      "Fetch the authenticated user's Pomodoro timer modes. Returns modes with id, name, focusTime, shortBreak, and longBreak (all in milliseconds).",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "update_mode",
    description:
      "Update an existing Pomodoro mode by name. All times should be in milliseconds. Common mode names are: Standard, Extended, Long run.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: {
          type: "STRING",
          description:
            "The name of the mode to update (e.g., Standard, Extended, Long run)",
        },
        focusTime: {
          type: "INTEGER",
          description: "Focus time duration in milliseconds",
        },
        shortBreak: {
          type: "INTEGER",
          description: "Short break duration in milliseconds",
        },
        longBreak: {
          type: "INTEGER",
          description: "Long break duration in milliseconds",
        },
      },
      required: ["name", "focusTime", "shortBreak", "longBreak"],
    },
  },
] as const;

export type ToolCall = {
  name: (typeof functionDeclarations)[number]["name"];
  args: Record<string, any>;
};

export async function executeTool(
  call: ToolCall,
  req: AuthRequest
): Promise<any> {
  const userId = req.user!.userId;
  switch (call.name) {
    // ===== TODOS =====
    case "get_todos": {
      const status = call.args?.status as string | undefined;
      const rows = await db
        .select()
        .from(todos)
        .where(eq(todos.userId, userId));
      const filtered = status
        ? rows.filter((t) => String(t.status) === status)
        : rows;
      return { todos: filtered };
    }

    case "create_todo": {
      const { title, description, status, dueDate } = call.args;
      const [todo] = await db
        .insert(todos)
        .values({
          userId,
          title,
          description,
          status,
          dueDate: dueDate ? new Date(dueDate) : null,
        })
        .returning();
      return { success: true, todo };
    }

    case "update_todo": {
      const { id, ...updates } = call.args;
      if (updates.dueDate) {
        updates.dueDate = new Date(updates.dueDate);
      }
      const [updated] = await db
        .update(todos)
        .set(updates)
        .where(eq(todos.id, id))
        .returning();
      return { success: true, todo: updated };
    }

    case "delete_todo": {
      const { id } = call.args;
      await db.delete(todos).where(eq(todos.id, id));
      return { success: true, message: "Todo deleted" };
    }

    // ===== REMINDERS =====
    case "get_reminders": {
      const rows = await db
        .select()
        .from(reminders)
        .where(eq(reminders.userId, userId));
      return { reminders: rows };
    }

    case "create_reminder": {
      const { title, description, date, time, priority } = call.args;
      const [reminder] = await db
        .insert(reminders)
        .values({
          userId,
          title,
          description,
          date,
          time,
          priority,
          completed: false,
        })
        .returning();
      return { success: true, reminder };
    }

    case "update_reminder": {
      const { id, ...updates } = call.args;
      const [updated] = await db
        .update(reminders)
        .set(updates)
        .where(eq(reminders.id, id))
        .returning();
      return { success: true, reminder: updated };
    }

    case "delete_reminder": {
      const { id } = call.args;
      await db.delete(reminders).where(eq(reminders.id, id));
      return { success: true, message: "Reminder deleted" };
    }

    // ===== HABITS =====
    case "get_habits": {
      const rows = await db
        .select()
        .from(habits)
        .where(eq(habits.userId, userId));
      return { habits: rows };
    }

    case "create_habit": {
      const { name, completions } = call.args;
      const [habit] = await db
        .insert(habits)
        .values({
          userId,
          name,
          completions,
        })
        .returning();
      return { success: true, habit };
    }

    case "update_habit": {
      const { id, ...updates } = call.args;
      const [updated] = await db
        .update(habits)
        .set(updates)
        .where(eq(habits.id, id))
        .returning();
      return { success: true, habit: updated };
    }

    case "delete_habit": {
      const { id } = call.args;
      await db.delete(habits).where(eq(habits.id, id));
      return { success: true, message: "Habit deleted" };
    }

    // ===== MODES =====
    case "get_modes": {
      const rows = await db
        .select()
        .from(modes)
        .where(eq(modes.userId, userId));
      return { modes: rows };
    }

    case "update_mode": {
      const { name, focusTime, shortBreak, longBreak } = call.args;
      const [updated] = await db
        .update(modes)
        .set({
          focusTime,
          shortBreak,
          longBreak,
        })
        .where(and(eq(modes.userId, userId), eq(modes.name, name)))
        .returning();
      return { success: true, mode: updated };
    }

    default:
      throw new Error(`Unknown tool: ${call.name}`);
  }
}
