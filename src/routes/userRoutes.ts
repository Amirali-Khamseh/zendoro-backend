import { Router } from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import { avatarUpload } from "../middlewares/uploadMiddleware";
import {
  getMe,
  uploadAvatar,
  removeAvatar,
  deleteAccount,
} from "../controllers/userController";

const router = Router();
router.get("/me", authenticateToken, getMe);
router.post("/avatar", authenticateToken, avatarUpload.single("avatar"), uploadAvatar);
router.delete("/avatar", authenticateToken, removeAvatar);
router.delete("/me", authenticateToken, deleteAccount);
export default router;
