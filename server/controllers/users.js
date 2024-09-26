import mongoose from "mongoose";
import User from "../models/User.js";

/* READ */
export const getAllUser = async (req, res) => {
  try {
    const { search } = req.query;

    // Build query filter based on search input
    let query = {};
    if (search) {
      query = {
        $or: [
          { email: { $regex: search, $options: "i" } }, // Case insensitive
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
        ],
      };
    }

    const users = await User.find(query).select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );

    const formattedFriends = friends.map(
      ({
        _id,
        firstName,
        lastName,
        email,
        occupation,
        location,
        picturePath,
        friends,
      }) => {
        return {
          _id,
          firstName,
          lastName,
          email,
          occupation,
          location,
          picturePath,
          friends,
        };
      }
    );
    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { id } = req.params; // id = logged-in user ID

    // Find all users who have the logged-in user's ID in their 'friends' list (followers)
    const followers = await User.find({ friends: id });

    // Format the follower data
    const formattedFollowers = followers.map(
      ({
        _id,
        firstName,
        lastName,
        email,
        occupation,
        location,
        picturePath,
        friends,
      }) => {
        return {
          _id,
          firstName,
          lastName,
          email,
          occupation,
          location,
          picturePath,
          friends,
          isFollowing: friends.includes(id), // Follow status for the logged-in user
        };
      }
    );

    res.status(200).json(formattedFollowers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserFriendDetails = async (req, res) => {
  try {
    const { userId, friendId } = req.params;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Find the friend by ID
    const friend = await User.findById(friendId);
    if (!friend) return res.status(404).json({ message: "Friend not found" });

    // Initialize the flags
    let isFriend = false;
    let isFollower = false;

    // Check if friendId is a direct friend
    if (user.friends.includes(friendId)) {
      isFriend = true;
    }

    // Check if friendId is a follower
    const potentialFollower = await User.findOne({
      _id: friendId,
      friends: userId,
    });
    if (potentialFollower) {
      isFollower = true;
    }

    // If neither friend nor follower, return 404
    if (!isFriend && !isFollower) {
      return res.status(404).json({ message: "Friend or Follower not found" });
    }

    // Compare friends of both users to identify mutual friends
    const mutualFriends = user.friends.filter((id) =>
      friend.friends.includes(id)
    );

    // Fetch details of mutual friends
    const mutualFriendDetails = await Promise.all(
      mutualFriends.map((id) => User.findById(id))
    );

    const formattedMutualFriends = mutualFriendDetails.map(
      ({
        _id,
        firstName,
        lastName,
        email,
        occupation,
        location,
        picturePath,
      }) => ({
        _id,
        firstName,
        lastName,
        email,
        occupation,
        location,
        picturePath,
      })
    );

    // Format and return the friend's details along with mutual friends
    const friendDetails = {
      _id: friend._id,
      firstName: friend.firstName,
      lastName: friend.lastName,
      email: friend.email,
      occupation: friend.occupation,
      location: friend.location,
      picturePath: friend.picturePath,
      friends: friend.friends,
      isFriend, // Indicates if the friendId is a direct friend of the user
      isFollower, // Indicates if the friendId is a follower (but not necessarily a direct friend)
      mutualFriends: formattedMutualFriends, // List of mutual friends
    };

    res.status(200).json(friendDetails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE */
export const addRemoveFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params; // id = logged-in user ID, friendId = the user to follow/unfollow
    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    // Check if the logged-in user is already following the friend
    const isFollowing = user.friends.includes(friendId);

    if (isFollowing) {
      // If following, remove the friend from the user's friends list (unfollow)
      user.friends = user.friends.filter((fId) => fId.toString() !== friendId);
    } else {
      // If not following, add the friend to the user's friends list (follow)
      user.friends.push(friendId);
    }

    await user.save();

    // Retrieve the updated friend list
    const friends = await Promise.all(
      user.friends.map((friendId) => User.findById(friendId))
    );

    // Format the friend list to include relevant details and follow status
    const formattedFriends = friends.map(
      ({
        _id,
        firstName,
        lastName,
        email,
        occupation,
        location,
        picturePath,
        friends,
      }) => {
        return {
          _id,
          firstName,
          lastName,
          email,
          occupation,
          location,
          picturePath,
          friends,
          isFollowing: user.friends.includes(_id.toString()), // Add follow status
        };
      }
    );

    // Return the updated list of friends with follow status
    res.status(200).json({
      message: isFollowing
        ? `You have unfollowed ${friend.firstName}.`
        : `You are now following ${friend.firstName}.`,
      friends: formattedFriends,
    });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    // Update the user document in the database
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updatedData }, // Use $set to update only the fields provided in req.body
      { new: true, runValidators: true } // Return the updated document and validate the data
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*DELETE Follower */
export const deleteFollower = async (req, res) => {
  try {
    const { id: loggedInUserId } = req.params; // loggedInUserId = the logged-in user's ID
    const { followerId } = req.body; // followerId = the ID of the follower to be removed

    // Find the follower user and remove the logged-in user's ID from their 'friends' list
    const followerUser = await User.findByIdAndUpdate(
      followerId,
      {
        $pull: { friends: loggedInUserId }, // Remove the logged-in user's ID from the 'friends' array
      },
      { new: true } // Return the updated document
    );

    if (!followerUser) {
      return res.status(404).json({ message: "Follower user not found." });
    }

    // Fetch the updated list of followers
    const updatedFollowers = await User.find({ friends: loggedInUserId });

    // Format the updated followers data
    const formattedFollowers = updatedFollowers.map(
      ({
        _id,
        firstName,
        lastName,
        email,
        occupation,
        location,
        picturePath,
        friends,
      }) => {
        return {
          _id,
          firstName,
          lastName,
          email,
          occupation,
          location,
          picturePath,
          friends,
          isFollowing: friends.includes(loggedInUserId), // Follow status for the logged-in user
        };
      }
    );

    res.status(200).json({
      message: "Follower removed successfully.",
      updatedFollowers: formattedFollowers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/*BLOCK User */
export const blockUser = async (req, res) => {
  try {
    const { userIdToBlock } = req.body; // User ID to block
    const userId = req.user.id; // ID of the user making the request (authenticated user)

    if (userId === userIdToBlock) {
      return res.status(400).json({ msg: "You cannot block yourself." });
    }

    // Add userIdToBlock to the blockedUsers array of the authenticated user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found." });

    if (user.blockedUsers.includes(userIdToBlock)) {
      return res.status(400).json({ msg: "User is already blocked." });
    }

    user.blockedUsers.push(userIdToBlock);
    await user.save();

    res.status(200).json({ msg: "User blocked successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*UNBLOCK User */
export const unblockUser = async (req, res) => {
  try {
    const { userIdToUnblock } = req.body; // User ID to unblock
    const userId = req.user.id; // ID of the user making the request (authenticated user)

    // Validate userIdToUnblock
    if (!mongoose.Types.ObjectId.isValid(userIdToUnblock)) {
      return res.status(400).json({ msg: "Invalid user ID." });
    }

    // Remove userIdToUnblock from the blockedUsers array of the authenticated user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found." });

    // Check if userIdToUnblock is actually in the blockedUsers array
    if (
      !user.blockedUsers.some(
        (id) =>
          mongoose.Types.ObjectId.isValid(id) &&
          id.toString() === userIdToUnblock
      )
    ) {
      return res.status(400).json({ msg: "User is not blocked." });
    }

    // Filter out invalid ObjectIds and remove userIdToUnblock from the blockedUsers array
    user.blockedUsers = user.blockedUsers
      .filter((id) => mongoose.Types.ObjectId.isValid(id)) // Filter out invalid ObjectIds
      .filter((id) => id.toString() !== userIdToUnblock); // Remove the unblocked user

    await user.save();

    res.status(200).json({ msg: "User unblocked successfully." });
  } catch (err) {
    console.error("Error in unblockUser:", err); // Debug log
    res.status(500).json({ error: err.message });
  }
};

/*getDailyTimeSpent */
export const getDailyTimeSpent = async (req, res) => {
  try {
    const { id } = req.params; // User ID from the request params
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ msg: "User not found." });

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the beginning of today

    // Create an array for the last 7 days
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date();
      day.setDate(today.getDate() - i);
      day.setHours(0, 0, 0, 0); // Set to the beginning of the day
      last7Days.push(day);
    }

    // Initialize an array to hold time spent for each day
    const timeSpentLast7Days = last7Days.map((day) => ({
      date: day,
      totalTimeSpent: 0, // initialize total time spent for this day
    }));

    // Aggregate the session logs
    user.sessionLogs.forEach((log) => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0); // Normalize log date to the beginning of the day

      // Find if the log falls within the last 7 days
      const dayEntry = timeSpentLast7Days.find(
        (entry) => entry.date.getTime() === logDate.getTime()
      );

      if (dayEntry) {
        dayEntry.totalTimeSpent += log.duration; // Add the duration for this day
      }
    });

    // Return data in the required format
    res.status(200).json({
      dailyTimeSpent: timeSpentLast7Days.reverse().map((entry) => ({
        date: entry.date,
        totalTimeSpent: entry.totalTimeSpent, // total time spent in minutes
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*GET widget preferences */

export const getwidget = async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // Use req.user.id
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.widgetPreferences || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatewidget = async (req, res) => {
  const widgets = req.body;

  // Validate widgets payload
  if (!widgets || typeof widgets !== "object") {
    return res.status(400).json({ message: "Invalid widgets data" });
  }

  try {
    const user = await User.findById(req.user.id); // Use req.user.id
    if (user) {
      // Convert the incoming object to a Map
      const widgetPreferencesMap = new Map(Object.entries(widgets));

      // Assign the converted Map to the user's widgetPreferences
      user.widgetPreferences = widgetPreferencesMap;
      await user.save();

      // Return the updated widgetPreferences directly from the saved user
      res.json({
        message: "Widget preferences updated successfully",
        widgetPreferences: user.widgetPreferences,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
