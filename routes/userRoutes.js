const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();
process.env.JWT_SECRET = "secret"
// Common response function
const sendResponse = (res, statusCode, success, message, data = null, errors = []) => {
  res.status(statusCode).json({ success, message, data, errors });
};

// Middleware to check authentication
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return sendResponse(res, 401, false, "Unauthorized access");

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return sendResponse(res, 403, false, "Invalid token");
  }
};

// me API Route
router.get("/me", authenticateToken, (req, res) => {
  sendResponse(res, 200, true, "Welcome to the API", { user: req.user });
});

// Signup Route
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return sendResponse(res, 400, false, "Validation failed", null, {
        name: name ? [] : ["The name field is required."],
        email: email ? [] : ["The email field is required."],
        password: password ? [] : ["The password field is required."]
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 409, false, "Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    sendResponse(res, 201, true, "User registered successfully", { id: user._id, name, email });
  } catch (error) {
    sendResponse(res, 500, false, "Internal Server Error");
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendResponse(res, 400, false, "Validation failed", null, {
        email: email ? [] : ["The email field is required."],
        password: password ? [] : ["The password field is required."]
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return sendResponse(res, 401, false, "Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendResponse(res, 401, false, "Invalid credentials");
    }

    const token = jwt.sign({
      id: user._id,
      name: user.name,
      email: user.email
    },
    process.env.JWT_SECRET, 
    {
      expiresIn: "1h" 
    });

    sendResponse(res, 200, true, "User logged in successfully", {
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.log(error)
    sendResponse(res, 500, false, "Internal Server Error");
  }
});

// Get Users with Pagination
router.get("/users", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const users = await User.find()
      .select("-password")
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    const totalUsers = await User.countDocuments();

    sendResponse(res, 200, true, "Users fetched successfully", {
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    sendResponse(res, 500, false, "Internal Server Error");
  }
});

module.exports = router;
