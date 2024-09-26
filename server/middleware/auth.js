import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token || !token.startsWith("Bearer ")) {
      return res
        .status(403)
        .json({ message: "Access Denied: No token provided" });
    }

    const tokenWithoutBearer = token.slice(7).trim(); // Remove 'Bearer ' from the token

    jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        // Handle specific token errors
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ message: "Token has expired" });
        } else if (err.name === "JsonWebTokenError") {
          return res.status(401).json({ message: "Invalid token" });
        }
        return res.status(500).json({ message: "Token verification failed" });
      }

      // Attach the verified token payload to req.user
      req.user = decoded;
      next(); // Move to the next middleware or route handler
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
