1 - Clone the Repo
2- Open the terminal in the oriject path and type `npm i install` , if you get error that means you do not have the npm globally installed
3- Create a file in the root called `.env` and copy the values from `.env-example` and paste there, make sure to variables called the same but the values should be based on your secrets
4- run the command `npm run db:generate` and then `npm run db:migrate`, make sure your Postgres DB is running on the connection string you set in `.env`, if things work properly you can run `npm run db:studio` and check the DB in your browser
5- run the app by `npm run dev`
6- Check the route `http://localhost:3000/health` if you see the result on the screen that means the backendservice is working

## API Reference

Base URL: `http://localhost:3000`

Authentication

- Most endpoints require a JWT in the Authorization header
  - Header: `Authorization: Bearer <token>`

### Health

- GET `/health`
  - Returns service status and timestamp.

---

## Auth

Routes are prefixed with `/auth`.

- POST `/auth/signup`

  - Body (JSON):
    - `name` string (required)
    - `email` string (required)
    - `password` string (required)
  - Responses:
    - 201: `{ message, user: { id, name, email }, token }`
    - 400: `{ error: "All fields are required" }` or `{ error: "Email already registered" }`
    - 500: `{ error: "Signup failed" }`
  - Notes:
    - On successful signup, default timer modes are seeded for the user.

- POST `/auth/login`
  - Body (JSON):
    - `email` string (required)
    - `password` string (required)
  - Responses:
    - 200: `{ message, user: { id, name, email }, token }`
    - 400: `{ error: "Email and password required" }`
    - 401: `{ error: "Invalid credentials" }`
    - 500: `{ error: "Login failed" }`

---

## Todos

Routes are prefixed with `/todo`. All require Authorization header.

Schema fields

- `id` number
- `title` string (required)
- `description` string (required)
- `status` enum one of `"TODO" | "In Progress" | "Done" | "Kill"` (required)
- `dueDate` ISO datetime string or null (optional)

- POST `/todo/`

  - Body (JSON): `{ title, description, status, dueDate? }`
  - Responses:
    - 200: Returns created todo row
    - 500: `{ error: "Failed to create todo" }`

- GET `/todo/`

  - Responses:
    - 200: `Todo[]` for the authenticated user
    - 401/403: Missing/invalid token

- PUT `/todo/:id`

  - Body (JSON): Partial updates allowed; if `dueDate` provided it should be parsable as a date
  - Responses:
    - 200: Updated todo
    - 404: `{ error: "Todo not found" }`
    - 500: `{ error: "Failed to update todo" }`

- DELETE `/todo/:id`
  - Responses:
    - 200: `{ message: "Todo deleted" }`
    - 500: `{ error: "Failed to delete todo" }`

---

## Reminders

Routes are prefixed with `/reminder`. All require Authorization header.

Schema fields

- `id` number
- `title` string (required)
- `description` string (optional)
- `date` string (YYYY-MM-DD) (required)
- `time` string (HH:mm or similar) (required)
- `priority` enum one of `"low" | "medium" | "high"` (required)
- `completed` boolean (defaults to false)

- POST `/reminder/`

  - Body (JSON): `{ title, description?, date, time, priority }`
  - Responses:
    - 200: Returns created reminder
    - 500: `{ error: "Failed to create reminder" }`

- GET `/reminder/`

  - Responses:
    - 200: `Reminder[]` for the authenticated user

- PUT `/reminder/:id`

  - Body (JSON): Partial updates allowed
  - Responses:
    - 200: Updated reminder

- DELETE `/reminder/:id`
  - Responses:
    - 200: `{ message: "Reminder deleted" }`

---

## Habits (hobby)

Routes are prefixed with `/hobby`. All require Authorization header.

Schema fields

- `id` number
- `name` string (required)
- `completions` array of 7 booleans (required) — one per weekday

- POST `/hobby/`

  - Body (JSON): `{ name, completions }`
    - Example: `{ "name": "Drink water", "completions": [false, true, true, false, true, false, false] }`
  - Responses:
    - 200: Returns created habit
    - 500: `{ error: "Failed to create habit" }`

- GET `/hobby/`

  - Responses:
    - 200: `Habit[]` for the authenticated user

- PUT `/hobby/:id`

  - Body (JSON): `{ name, completions }`
  - Responses:
    - 200: Updated habit

- DELETE `/hobby/:id`
  - Responses:
    - 200: `{ message: "Habit deleted" }`

---

## Timer Modes

Routes are prefixed with `/timer`. All require Authorization header.

Schema fields

- `id` number
- `name` string (e.g., `"Standard"`, `"Extended"`, `"Long run"`)
- `focusTime` number (milliseconds)
- `shortBreak` number (milliseconds)
- `longBreak` number (milliseconds)

- GET `/timer/`

  - Responses:
    - 200: `Mode[]` for the authenticated user

- POST `/timer/`
  - Purpose: Update an existing mode by `name` for the user
  - Body (JSON): `{ name, focusTime, shortBreak, longBreak }`
  - Responses:
    - 200: Updated mode
    - 404: `{ error: "Mode '<name>' not found. Cannot update non-existing mode." }`
    - 500: `{ error: "Failed to update mode" }`
  - Notes:
    - Signup seeds default modes. Only updates are allowed; creating new arbitrary mode names will return 404.

---

## Error Codes

- 401 Unauthorized: Missing token
- 403 Forbidden: Invalid token
- 404 Not Found: Resource not found (e.g., todo or mode not found)
- 500 Internal Server Error: Unexpected server errors

## Quick Start Flow

1. Sign up via `/auth/signup`, copy the `token` from the response
2. Use `Authorization: Bearer <token>` for all protected endpoints
3. Create and manage todos, reminders, and habits; view/update timer modes
