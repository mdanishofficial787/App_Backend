const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Driver = require("../Schema/Driver");

module.exports = async (req, res, next) => {
  try {
    // ==========================================
    // 1. GET AUTHORIZATION HEADER
    // ==========================================

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        isLoggedIn: false,
        message: "No token provided",
      });
    }

    // ==========================================
    // 2. EXTRACT BEARER TOKEN
    // ==========================================

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

    // ==========================================
    // 3. CHECK JWT SECRET
    // ==========================================

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is not configured",
      });
    }

    // ==========================================
    // 4. VERIFY JWT
    // ==========================================

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        isLoggedIn: false,
        message: "Invalid or expired token",
      });
    }

    // ==========================================
    // 5. GET DRIVER ID FROM TOKEN
    // ==========================================

    const driverId = decoded.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        isLoggedIn: false,
        message: "Token does not contain driver ID",
      });
    }

    // ==========================================
    // 6. CHECK OBJECT ID FORMAT
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(401).json({
        success: false,
        isLoggedIn: false,
        message: "Invalid driver ID in token",
      });
    }

    // ==========================================
    // 7. FIND DRIVER
    // ==========================================

    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(401).json({
        success: false,
        isLoggedIn: false,
        message: "Driver not found",
      });
    }

    // ==========================================
    // 8. SAVE DRIVER IN REQUEST
    // ==========================================

    req.user = {
      id: driver._id.toString(),
      driver: driver,
    };

    // ==========================================
    // 9. AUTH SUCCESS
    // ==========================================

    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error.message);

    return res.status(401).json({
      success: false,
      isLoggedIn: false,
      message: "Session expired or invalid token",
    });
  }
};