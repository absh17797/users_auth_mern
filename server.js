const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: "*", // Allow frontend to access API
  credentials: true, // Allow cookies, authorization headers, etc.
}));

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/users", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userRoutes = require("./routes/userRoutes");
app.use("/api", userRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
