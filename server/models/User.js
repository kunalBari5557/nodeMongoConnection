import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    lastName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    email: {
      type: String,
      required: true,
      max: 50,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 5,
    },
    picturePath: {
      type: String,
      default: "",
    },
    friends: {
      type: Array,
      default: [],
    },
    location: String,
    occupation: String,
    viewedProfile: Number,
    impressions: Number,
    bookmarks: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Post",
      default: [],
    },
    widgetPreferences: {
      type: Map,
      of: Boolean,
      default: {
        Profile: true,
        CreatePost: true,
        RecentSocialPosts: true,
        Sponsored: true,
        Followers: true,
        Following: true,
        MyBookmarkList: true,
        ArchivedPosts: false,
      },
    },
    resetToken: String,
    resetTokenExpiration: Date,
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    sessionLogs: [
      {
        date: { type: Date, default: Date.now },
        duration: { type: Number, default: 0 }, // duration in minutes
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
export default User;
