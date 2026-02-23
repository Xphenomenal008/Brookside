require("dotenv").config();
const express=require("express")
const app=express()
const connectDB=require("./config/db")
const cors=require("cors");
const authMiddleware = require("./middlewares/middleware");


connectDB()

// app.use(express.json())
app.use(cors())
app.use(express.json())

// app.use((req, res, next) => {
//   console.log("BODY:", (req.body)
//   );
//   next();
// });
// app.use((req, res, next) => {
//   console.log("header:", (req.headers["content-type"])
//   );
//   next();
// });

app.get("/health",(req,res)=>{
  res.send("helthy from podcast!")

})

app.use((req, res, next) => {
  console.log("file:", (req.file)
  );
  next();
});

app.use("/podcasts",require("./routes/podcast-routes"))
// app.use("/internal",require("./routes/podcast-routes"))


const PORT=process.env.PORT || 4002
const server=app.listen(PORT,(req,res)=>{
    console.log(`Podcast service is running! ${PORT}`)
})
module.exports=server
