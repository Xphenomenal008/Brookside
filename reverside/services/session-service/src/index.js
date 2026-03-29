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

      // notify others
      socket.to(sessionId).emit("user-joined", { userId });

      // FIX 1: use correct field name + populate
      const session = await Session.findById(sessionId)
        .populate("participants.userId", "name email");

      if (!session) return;

      const exists = session.participants.some(
        (p) => p.userId?._id.toString() === userId.toString()
      );

      if (!exists) {
        session.participants.push({
          userId: userId,
          joinedAt: new Date(),
        });

        await session.save();
      }

      // fetch updated again with populate
      const updatedSession = await Session.findById(sessionId)
        .populate("participants.userId", "name email");

      io.to(sessionId).emit(
        "participants-update",
        updatedSession.participants
      );

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