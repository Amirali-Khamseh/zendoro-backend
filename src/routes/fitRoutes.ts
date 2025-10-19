import { Router } from "express";
import fitController from "../controllers/fitController";

const router = Router();
router.use("/", fitController);

export default router;
