const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();
process.env.JWT_SECRET = "secret";

// Common response function
const sendResponse = (res, statusCode, success, message, data = null, formFieldErrors = {}, errors = []) => {
  res.status(statusCode).json({ success, message, data, formFieldErrors, errors });
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
  sendResponse(res, 200, true, "User authenticated successfully", { user: req.user });
});

// Signup Route
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const formFieldErrors = {};

    if (!name) formFieldErrors.name = ["The name field is required."];
    if (!email) formFieldErrors.email = ["The email field is required."];
    else if (!/^\S+@\S+\.\S+$/.test(email)) formFieldErrors.email = ["Invalid email format."];

    if (!password) formFieldErrors.password = ["The password field is required."];
    else if (password.length < 6) formFieldErrors.password = ["Password must be at least 6 characters."];

    if (Object.keys(formFieldErrors).length > 0) {
      return sendResponse(res, 400, false, "Validation failed", null, formFieldErrors);
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
    console.error(error);
    sendResponse(res, 500, false, "Internal Server Error", null, {}, ["Error saving user to database."]);
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const formFieldErrors = {};

    if (!email) formFieldErrors.email = ["The email field is required."];
    if (!password) formFieldErrors.password = ["The password field is required."];

    if (Object.keys(formFieldErrors).length > 0) {
      return sendResponse(res, 400, false, "Validation failed", null, formFieldErrors);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return sendResponse(res, 401, false, "Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendResponse(res, 401, false, "Invalid credentials");
    }

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    sendResponse(res, 200, true, "User logged in successfully", {
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, false, "Internal Server Error", null, {}, ["Error during login process."]);
  }
});

// Get Users with Pagination
router.get("/users", authenticateToken, async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || page < 1) {
      return sendResponse(res, 400, false, "Invalid page number", null, {}, ["Page must be a positive integer."]);
    }

    if (isNaN(limit) || limit < 1) {
      return sendResponse(res, 400, false, "Invalid limit", null, {}, ["Limit must be a positive integer."]);
    }

    const users = await User.find()
      .select("-password")
      .limit(limit)
      .skip((page - 1) * limit);
    const totalUsers = await User.countDocuments();

    sendResponse(res, 200, true, "Users fetched successfully", {
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, false, "Internal Server Error", null, {}, ["Error fetching users from database."]);
  }
});

router.get("/preload", (req, res) => {
  res.status(103).json({ success: true, message: "Early hints", hint: "You can preload resources" });
});

router.delete("/user/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }
    res.status(204).send(); // No Content
  } catch (error) {
    sendResponse(res, 500, false, "Internal Server Error");
  }
});

router.get("/old-route", (req, res) => {
  res.redirect(301, "/api/new-route"); // Redirect permanently
});
router.get("/new-route", (req, res) => {
  sendResponse(res, 200, true, "Redirected to new API route successfully");
});

router.get("/500-error", (req, res) => {
  sendResponse(res, 500, false, "Internal Server Error");
});


module.exports = router;
