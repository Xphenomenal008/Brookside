const internalAuth = (req, res, next) => {
  console.log("🔐 internalAuth headers:", req.headers["x-internal-key"]);
  console.log("🔐 expected:", process.env.INTERNAL_KEY);

  if (req.headers["x-internal-key"] !== process.env.INTERNAL_KEY) {
    return res.status(403).json({ message: "forbidden" });
  }
  next();
};
 
module.exports=internalAuth