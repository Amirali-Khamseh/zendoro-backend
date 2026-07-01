import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import timerRoutes from "./routes/timerRoutes";
import reminderRoutes from "./routes/reminderRoutes";
import todoRoutes from "./routes/todoRoutes";
import hobbyRoutes from "./routes/hobbyRoutes";
import goalRoutes from "./routes/goalRoutes";
import agentRoutes from "./routes/agentRoutes";
import userRoutes from "./routes/userRoutes";
import { sanitizeInput } from "./middlewares/inputSanitizationMiddleware";
const app = express();
const port = process.env.PORT || 3000;
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(sanitizeInput);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Zendoro API Service",
  });
});

app.use("/auth", authRoutes);
app.use("/timer", timerRoutes);
app.use("/hobby", hobbyRoutes);
app.use("/todo", todoRoutes);
app.use("/reminder", reminderRoutes);
app.use("/goal", goalRoutes);
app.use("/agent", agentRoutes);
app.use("/user", userRoutes);

app.listen(port, () => {
  return console.log(`Express is listening at PORT: ${port}`);
});
export default app;
