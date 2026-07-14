require("dotenv").config();
const connectDB = require("./config/db");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const documentRoutes = require("./routes/documents.routes");
const noticeRoutes = require("./routes/notices.routes");
const profileRoutes = require("./routes/profile.routes");
const notificationRoutes = require("./routes/notifications.routes"); 
const summaryRoutes = require("./routes/summary.routes");

const app = express();
const PORT = process.env.PORT || 5000;


// ===== Middleware =====
app.use(
  cors({
    origin: [
  "http://localhost:3000",
  process.env.CLIENT_URL,
],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Root Route =====
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// ===== Routes =====
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/documents", summaryRoutes);   
app.use("/api/notices", noticeRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes); 

// ===== Health Check =====
app.get("/api/health", (req, res) =>
  res.json({ status: "OK", message: "Academia Share API running" })
);

// ===== 404 Handler =====
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ===== Error Handler =====
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});