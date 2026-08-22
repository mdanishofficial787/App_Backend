const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Token check
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        isLoggedIn: false,
        message: "No token provided",
      });
    }

    // Extract token from "Bearer <token>"
    let token = authHeader.trim();

    if (/^Bearer\s+/i.test(token)) {
      token = token.replace(/^Bearer\s+/i, "").trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        isLoggedIn: false,
        message: "Invalid authorization format",
      });
    }

    // JWT secret must exist
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Store decoded user data
    req.user = decoded;

    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      isLoggedIn: false,
      message: "Session expired or invalid token",
      error: err.message,
    });
  }
};