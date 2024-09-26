import express from "express";
import {
  getUser,
  getUserFriends,
  addRemoveFriend,
  updateUserProfile,
  getUserFriendDetails,
  getFollowers,
  deleteFollower,
  getAllUser,
  blockUser,
  unblockUser,
  getDailyTimeSpent,
  getwidget,
  updatewidget,
} from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/getAll", getAllUser);
router.get("/:id", verifyToken, getUser);
router.get("/:id/friends/following", verifyToken, getUserFriends);
router.get("/:userId/friend/details/:friendId", getUserFriendDetails);
router.get("/:id/followers", verifyToken, getFollowers);
router.get("/:id/getDailyTimeSpent", verifyToken, getDailyTimeSpent);
router.get("/get/widget", verifyToken, getwidget);

/*POST */
router.post("/:id/friends/:friendId", verifyToken, addRemoveFriend);
router.post("/blockUser", verifyToken, blockUser);
router.post("/unblockUser", verifyToken, unblockUser);

/* UPDATE */
router.put("/updateUser/:id", updateUserProfile);
router.put("/update/widget", verifyToken, updatewidget);

/*DELETE */
router.delete("/:id/followers/delete", deleteFollower);

export default router;
