CREATE TYPE "public"."goal_status" AS ENUM('active', 'completed', 'archived');--> statement-breakpoint
CREATE TABLE "goal_habits" (
	"goal_id" integer NOT NULL,
	"habit_id" integer NOT NULL,
	CONSTRAINT "goal_habits_goal_id_habit_id_pk" PRIMARY KEY("goal_id","habit_id")
);
--> statement-breakpoint
CREATE TABLE "goal_reminders" (
	"goal_id" integer NOT NULL,
	"reminder_id" integer NOT NULL,
	CONSTRAINT "goal_reminders_goal_id_reminder_id_pk" PRIMARY KEY("goal_id","reminder_id")
);
--> statement-breakpoint
CREATE TABLE "goal_todos" (
	"goal_id" integer NOT NULL,
	"todo_id" integer NOT NULL,
	CONSTRAINT "goal_todos_goal_id_todo_id_pk" PRIMARY KEY("goal_id","todo_id")
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"target_date" date,
	"status" "goal_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goal_habits" ADD CONSTRAINT "goal_habits_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_habits" ADD CONSTRAINT "goal_habits_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_reminders" ADD CONSTRAINT "goal_reminders_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_reminders" ADD CONSTRAINT "goal_reminders_reminder_id_reminders_id_fk" FOREIGN KEY ("reminder_id") REFERENCES "public"."reminders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_todos" ADD CONSTRAINT "goal_todos_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_todos" ADD CONSTRAINT "goal_todos_todo_id_todos_id_fk" FOREIGN KEY ("todo_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;