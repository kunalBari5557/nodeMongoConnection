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
