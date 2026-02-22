require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDb=require("./config/db")

const app = express();

/* ===================== GLOBAL MIDDLEWARE ===================== */
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json())
app.use(cookieParser());
app.get("/heathy",(req,res)=>{
  res.send("helthy from auth!")

})
// app.use((req,res,next)=>{
//   console.log(`incoming body of auth ${req.body}`)
//   next()
// })
connectDb()


app.use("/",require("./routes/auth-routes"))

PORT=process.env.PORT || "4001"
app.listen(PORT,()=>{
  console.log(`running ${PORT}`)
})