const jwt = require("jsonwebtoken"); 

const authMiddleware = (req, res, next) => {
  console.log("🔐 authMiddleware hit");

  const authHeader = req.headers.authorization;
  console.log("authHeader:", authHeader);

  if (!authHeader) {
    console.log("❌ No auth header");
    return res.status(401).json({ message: "unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  console.log("token:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded:", decoded);

    req.userId = decoded.userId;
    next();
  } catch (e) {
    console.log("❌ JWT error:", e.message);
    return res.status(401).json({ message: "unauthorized" });
  }
};
module.exports=authMiddleware