import express from "express";
import { login, resetPasswordUser, sendEmail } from "../controllers/auth.js";

const router = express.Router();

/*POST */
router.post("/login", login);
router.post("/forgot-password", sendEmail);
router.post("/reset-password", resetPasswordUser);

export default router;
