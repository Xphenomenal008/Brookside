require("dotenv").config();
const express = require("express");
const app = express();
const connectDb = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const Session = require("./model/sessionModel");

app.use(express.json());

connectDb();

app.use("/session", require("./routes/sessionRoutes"));

app.get("/health", (req, res) => {
  res.send("helthy from session-service!");
});

const PORT = process.env.PORT || 4003;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ---- JOIN SESSION ----
  socket.on("join-session", async ({ sessionId, userId }) => {
    try {
      socket.join(sessionId);

      const session = await Session.findById(sessionId);
      if (!session) return;

      const exists = session.participants.some(
        (p) => p.userid.toString() === userId.toString()
      );

      if (!exists) {
        session.participants.push({
          userid: userId,
          joinedAt: new Date(),
        });

        await session.save();
      }

      io.to(sessionId).emit("participants-update", session.participants);

    } catch (err) {
      console.log("Socket join error:", err.message);
    }
  });

  // ---- WEBRTC SIGNALING ----
  socket.on("offer", ({ sessionId, offer }) => {
    socket.to(sessionId).emit("offer", offer);
  });

  socket.on("answer", ({ sessionId, answer }) => {
    socket.to(sessionId).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ sessionId, candidate }) => {
    socket.to(sessionId).emit("ice-candidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Session service running on port ${PORT}`);
});

module.exports = server;