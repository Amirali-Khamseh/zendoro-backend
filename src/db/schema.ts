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
export const modeNameEnum = pgEnum("mode_name", [
  "standard",
  "extended",
  "longRun",
]);
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

  name: modeNameEnum("name").notNull(),
  focusTime: integer("focus_time").notNull(),
  shortBreak: integer("short_break").notNull(),
  longBreak: integer("long_break").notNull(),
});

// ---------------- HABITS ----------------
// completions = array of 7 booleans (for each weekday)
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

// ---------------- RELATIONS ----------------
export const userRelations = relations(users, ({ many }) => ({
  modes: many(modes),
  habits: many(habits),
  reminders: many(reminders),
  todos: many(todos),
}));

export const modeRelations = relations(modes, ({ one }) => ({
  user: one(users, {
    fields: [modes.userId],
    references: [users.id],
  }),
}));

export const habitRelations = relations(habits, ({ one }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
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
