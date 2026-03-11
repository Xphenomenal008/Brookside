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
      socket.to(sessionId).emit("user-joined", { userId });

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

  /* The code block you provided is handling WebRTC signaling in a Node.js application using Socket.IO.
  WebRTC (Web Real-Time Communication) is a technology that enables real-time communication between
  browsers or other clients. In this context, the code is facilitating the exchange of signaling
  messages between clients to establish a peer-to-peer connection for audio, video, or data sharing. */
  
  
 // ---- WEBRTC SIGNALING ----
socket.on("offer", ({ sessionId, offer }) => {
  console.log("OFFER received");
  console.log("From socket:", socket.id);
  console.log("Session:", sessionId);
  console.log("Offer:", offer);

  socket.to(sessionId).emit("offer", offer);
});

socket.on("answer", ({ sessionId, answer }) => {
  console.log("ANSWER received");
  console.log("From socket:", socket.id);
  console.log("Session:", sessionId);
  console.log("Answer:", answer);

  socket.to(sessionId).emit("answer", answer);
});

socket.on("ice-candidate", ({ sessionId, candidate }) => {
  console.log("ICE Candidate received");
  console.log("From socket:", socket.id);
  console.log("Session:", sessionId);
  console.log("Candidate:", candidate);

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