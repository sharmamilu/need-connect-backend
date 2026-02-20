const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const errorMiddleware = require("./middlewares/error.middleware");
const portfolioRoutes = require("./routes/portfolio.routes");
const uploadRoutes = require("./routes/upload.routes");
const postRoutes = require("./routes/post.routes");


const app = express();

// DB
connectDB();

console.log("the request is coming to the server from the route named ", process.env.PORT);
// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/posts", postRoutes);



// Error Handler
app.use(errorMiddleware);

module.exports = app;
