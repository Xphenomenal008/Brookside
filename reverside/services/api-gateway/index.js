const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
const authMiddleware = require("./authMiddleware"); // JWT middleware
require("dotenv").config();

const app = express();

/* ================= GLOBAL MIDDLEWARE ================= */
app.use(cors({
  origin: true,
  credentials: true
}));

const authservice=process.env.AUTH_SERVICE;
const podcastservice=process.env.PODCAST_SERVICE;
const sessionservice=process.env.SESSION_SERVICE;

// app.use((req, res, next) => {
//   console.log("➡️ Incoming:", req.method, req.originalUrl);
//   console.log("Authorization:", req.headers.authorization);
//   next();
// });


/* ================= AUTH SERVICE ================= */
/*
  Public routes
  /auth/signup
  /auth/login
  /auth/verify-otp
*/
app.use(
  "/auth",
  createProxyMiddleware({
    target: authservice,
    changeOrigin: true
  })
);



/* ================= PODCAST SERVICE ================= */
/*
  Protected routes
  /podcasts
*/
app.use(
  "/podcasts",
  authMiddleware,
  createProxyMiddleware({
    target: podcastservice,
    changeOrigin: true,
    onProxyReq(proxyReq, req) {
      // ✅ forward already-existing header
      if (req.headers["x-user-id"]) {
        proxyReq.setHeader("x-user-id", req.headers["x-user-id"]);
      }
    }
  })
);
app.get("/heathy",(req,res)=>{
  res.send("helthy from apigateway!")

})
//====================================sessionDB=============================================
app.use(
  "/sessions",
  authMiddleware,
  createProxyMiddleware({
    target: sessionservice,
    changeOrigin: true,
    onProxyReq(proxyReq, req) {
      // forward already-existing header
      if (req.headers["x-user-id"]) {
        proxyReq.setHeader("x-user-id", req.headers["x-user-id"]);
      }
    }
  })
);






/* ================= HEALTH CHECK ================= */
app.get("/health", (req, res) => {
  res.json({ message: "API Gateway running" });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
