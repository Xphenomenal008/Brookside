require("dotenv").config();
const express=require("express")
const app=express()
const connectDb=require("./config/db")
const http = require("http");
const { Server } = require("socket.io");
 
app.use(express.json())

connectDb()
//for the debugging purpose
// app.use((req,res,next)=>{
//     console.log(`this is your incoming body ${req.body}`)
//     next()
// })

app.use("/session",require("./routes/sessionRoutes"))
app.get("/health",(req,res)=>{
  res.send("helthy from session-service!")

})



const PORT = process.env.PORT || 4003;

// create HTTP server from express app
const server = http.createServer(app);

// attach socket.io
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// ---- SOCKET LOGIC ----
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-session", async ({ sessionId, userId }) => {
    socket.join(sessionId);

    console.log(`User ${userId} joined session ${sessionId}`);

    socket.to(sessionId).emit("user-joined", { userId });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// start server
server.listen(PORT, () => {
  console.log(`Session service running on port ${PORT}`);
});

module.exports = server;
