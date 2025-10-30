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
  sessionFocusCounts: many(sessionFocusCounts),
}));

export const reminderRelations = relations(reminders, ({ one }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
}));

export const todoRelations = relations(todos, ({ one }) => ({
  user: one(users, {
    fields: [todos.userId],
    references: [users.id],
  }),
}));
