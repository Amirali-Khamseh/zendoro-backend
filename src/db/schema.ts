import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  date,
  timestamp,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------- ENUMS ----------------

export const reminderPriorityEnum = pgEnum("reminder_priority", [
  "low",
  "medium",
  "high",
]);
export const todoStatusEnum = pgEnum("todo_status", [
  "TODO",
  "In Progress",
  "Done",
  "Kill",
]);
export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "completed",
  "archived",
]);

// ---------------- USER ----------------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
});

// ---------------- MODES ----------------
export const modes = pgTable("modes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 255 }).notNull(),
  focusTime: integer("focus_time").notNull(),
  shortBreak: integer("short_break").notNull(),
  longBreak: integer("long_break").notNull(),
});

// ---------------- HABITS ----------------
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 255 }).notNull(),
  completions: boolean("completions").array(7).notNull(),
});

// ---------------- REMINDERS ----------------
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  time: varchar("time", { length: 10 }).notNull(),
  priority: reminderPriorityEnum("priority").notNull(),
  completed: boolean("completed").default(false).notNull(),
});

// ---------------- TODOS ----------------
export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: todoStatusEnum("status").notNull(),
  dueDate: timestamp("due_date", { withTimezone: false }).default(null),
});

// ---------------- GOALS ----------------
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetDate: date("target_date"),
  status: goalStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

// Join tables linking a goal to many todos / habits / reminders (and vice
// versa). Both FKs cascade so deleting a goal or an item only removes the
// link rows, never the items themselves.
export const goalTodos = pgTable(
  "goal_todos",
  {
    goalId: integer("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    todoId: integer("todo_id")
      .notNull()
      .references(() => todos.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.goalId, t.todoId] })]
);

export const goalHabits = pgTable(
  "goal_habits",
  {
    goalId: integer("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    habitId: integer("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.goalId, t.habitId] })]
);

export const goalReminders = pgTable(
  "goal_reminders",
  {
    goalId: integer("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    reminderId: integer("reminder_id")
      .notNull()
      .references(() => reminders.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.goalId, t.reminderId] })]
);

// ---------------- SESSION FOCUS COUNTS ----------------
export const sessionFocusCounts = pgTable("session_focus_counts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  sessionCount: integer("session_count").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .defaultNow()
    .notNull(),
});

// ---------------- RELATIONS ----------------

export const modeRelations = relations(modes, ({ one }) => ({
  user: one(users, {
    fields: [modes.userId],
    references: [users.id],
  }),
}));

export const sessionFocusCountRelations = relations(
  sessionFocusCounts,
  ({ one }) => ({
    user: one(users, {
      fields: [sessionFocusCounts.userId],
      references: [users.id],
    }),
  })
);

export const userRelations = relations(users, ({ many }) => ({
  modes: many(modes),
  habits: many(habits),
  reminders: many(reminders),
  todos: many(todos),
  goals: many(goals),
  sessionFocusCounts: many(sessionFocusCounts),
}));

export const reminderRelations = relations(reminders, ({ one, many }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
  goalReminders: many(goalReminders),
}));

export const todoRelations = relations(todos, ({ one, many }) => ({
  user: one(users, {
    fields: [todos.userId],
    references: [users.id],
  }),
  goalTodos: many(goalTodos),
}));

export const habitRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  goalHabits: many(goalHabits),
}));

export const goalRelations = relations(goals, ({ one, many }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
  goalTodos: many(goalTodos),
  goalHabits: many(goalHabits),
  goalReminders: many(goalReminders),
}));

export const goalTodosRelations = relations(goalTodos, ({ one }) => ({
  goal: one(goals, {
    fields: [goalTodos.goalId],
    references: [goals.id],
  }),
  todo: one(todos, {
    fields: [goalTodos.todoId],
    references: [todos.id],
  }),
}));

export const goalHabitsRelations = relations(goalHabits, ({ one }) => ({
  goal: one(goals, {
    fields: [goalHabits.goalId],
    references: [goals.id],
  }),
  habit: one(habits, {
    fields: [goalHabits.habitId],
    references: [habits.id],
  }),
}));

export const goalRemindersRelations = relations(goalReminders, ({ one }) => ({
  goal: one(goals, {
    fields: [goalReminders.goalId],
    references: [goals.id],
  }),
  reminder: one(reminders, {
    fields: [goalReminders.reminderId],
    references: [reminders.id],
  }),
}));
