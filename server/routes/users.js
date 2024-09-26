import express from "express";
import { getUser, getAllUser } from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/getAll", getAllUser);
router.get("/:id", verifyToken, getUser);

export default router;
