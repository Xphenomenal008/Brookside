require("dotenv").config();
const express=require("express")
const app=express()
const connectDb=require("./config/db")
 
app.use(express.json())

connectDb()
//for the debugging purpose
// app.use((req,res,next)=>{
//     console.log(`this is your incoming body ${req.body}`)
//     next()
// })

app.use("/session",require("./routes/sessionRoutes"))
app.get("/heathy",(req,res)=>{
  res.send("helthy from session-service!")

})


const PORT=process.env.PORT || 4003
app.listen(PORT,(req,res)=>{
    console.log("working")
})