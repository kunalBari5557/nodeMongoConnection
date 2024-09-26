import express from "express";
import {
  login,
  logout,
  resetPasswordUser,
  sendEmail,
} from "../controllers/auth.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/*POST */
router.post("/login", login);
router.post("/logout", verifyToken, logout);
router.post("/forgot-password", sendEmail);
router.post("/reset-password", resetPasswordUser);

export default router;
