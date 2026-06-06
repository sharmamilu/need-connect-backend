const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const errorMiddleware = require("./middlewares/error.middleware");
const portfolioRoutes = require("./routes/portfolio.routes");
const uploadRoutes = require("./routes/upload.routes");
const postRoutes = require("./routes/post.routes");
const likeRoutes = require("./routes/like.routes");
const commentRoutes = require("./routes/comment.routes");
const reviewRoutes = require("./routes/review.routes");
const listingRoutes = require("./routes/listing.routes");
const adminRoutes = require("./routes/admin.routes");
const documentRoutes = require("./routes/document.routes");

const app = express();

// DB
connectDB();
// Set security HTTP headers
app.use(helmet());

// CORS configuration - Must be before rate limiting and routes
// This setup allows all origins dynamically and supports credentials
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// Rate limiting (basic security against DDoS and brute force)
const limiter = rateLimit({
  max: 1000, // Limit each IP to 1000 requests per windowMs
  windowMs: 15 * 60 * 1000, // 15 minutes
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Respond with JSON so API clients can always parse the body.
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests from this IP, please try again later.",
    });
  },
});

// Apply rate limiting specifically to all dynamic API routes
app.use("/api", limiter);

// Middlewares
app.use(express.json({ limit: "50mb" })); // Increased to 50mb to support large image arrays via Base64 if used
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Data sanitization against NoSQL query injection
// Custom wrapped for Express 5 (prevents getter reassignment errors on req.query)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.query) mongoSanitize.sanitize(req.query);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/documents", documentRoutes);

// Error Handler
app.use(errorMiddleware);

module.exports = app;
