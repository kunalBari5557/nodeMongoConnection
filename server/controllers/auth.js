import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

/* REGISTER USER */
export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      picturePath,
      friends,
      location,
      occupation,
    } = req.body;

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: passwordHash,
      picturePath,
      friends,
      location,
      occupation,
      viewedProfile: Math.floor(Math.random() * 10000),
      impressions: Math.floor(Math.random() * 10000),
    });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* LOGGING IN */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) return res.status(400).json({ msg: "User does not exist." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials." });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Track login session start time
    const session = {
      date: new Date(),
      duration: 0, // Set initial duration to 0; we'll calculate it later
    };
    user.sessionLogs.push(session);
    await user.save();

    delete user.password;
    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*Reset Password*/

export async function sendEmailInternal(to, subject, html) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "kunal.dignizant@gmail.com", // Ensure correct email
        pass: "whik ogms rqnt zeak", // Ensure correct password or app password
      },
    });

    const mailOptions = {
      from: "kunal.dignizant@gmail.com",
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error); // Log the email error
    throw error; // Rethrow error to handle in the calling function
  }
}

function generateResetToken() {
  return crypto.randomBytes(20).toString("hex");
}

export async function sendEmail(req, res) {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = generateResetToken();
    const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour expiration

    // Update the user with reset token and expiration
    user.resetToken = resetToken;
    user.resetTokenExpiration = resetTokenExpiration;
    await user.save();

    const resetLink = `http://localhost:3000/createNewPassword?token=${resetToken}&email=${email}`;
    const emailMessage = `
      <p>You have requested to reset your password. Click the link below to reset it:</p>
      <a href="${resetLink}">Reset Password</a>
    `;

    await sendEmailInternal(email, "Password Reset Request", emailMessage);

    return res.status(200).json({
      email: email,
      resetToken: resetToken,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    console.error("Error in sendEmail:", error); // Log the error for debugging
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
}

export async function resetPasswordUser(req, res) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      email: email,
      resetTokenExpiration: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password and clear the reset token and its expiration
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiration = null;

    // Save the updated user back to the database
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
