require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const groupRoutes = require("./routes/groups");

const app = express();

app.use(cors());
app.use(express.json());

// Simple health check - useful for confirming deployment works
app.get("/", (req, res) => {
  res.json({ status: "SplitEasy API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);

// Basic 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SplitEasy server running on http://localhost:${PORT}`);
});
