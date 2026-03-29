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
app.get("/health", (req, res) => res.send("healthy from session-service!"));

const PORT = process.env.PORT || 4003;
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ✅ Track participants in memory per session to avoid DB race conditions
// Map<sessionId, Map<userId, { userId, userName, socketId }>>
const sessionParticipants = new Map()

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  let currentSessionId = null
  let currentUserId = null

  socket.on("join-session", async ({ sessionId, userId, userName }) => {
    console.log(`join-session: user=${userId} name=${userName} session=${sessionId}`)

    socket.join(sessionId)
    currentSessionId = sessionId
    currentUserId = userId

    // ✅ FIX 2: manage participants in memory — no DB read race condition
    if (!sessionParticipants.has(sessionId)) {
      sessionParticipants.set(sessionId, new Map())
    }

    const room = sessionParticipants.get(sessionId)

    // ✅ FIX 1: overwrite by userId key — no duplicates even if socket reconnects
    room.set(userId, { userId, userName: userName || "User", socketId: socket.id })

    const participantsList = Array.from(room.values())

    console.log(`Room ${sessionId} now has ${participantsList.length} participant(s):`, participantsList.map(p => p.userName))

    // ✅ broadcast updated list to ALL in room (both sides update)
    io.to(sessionId).emit("participants-update", participantsList)

    // ✅ notify others that a new user joined (for WebRTC offer)
    socket.to(sessionId).emit("user-joined", { userId, userName })
  })

  // ── WebRTC signaling ──

  socket.on("offer", ({ sessionId, offer }) => {
    console.log("Relaying offer to room:", sessionId)
    socket.to(sessionId).emit("offer", offer)
  })

  socket.on("answer", ({ sessionId, answer }) => {
    console.log("Relaying answer to room:", sessionId)
    socket.to(sessionId).emit("answer", answer)
  })

  socket.on("ice-candidate", ({ sessionId, candidate }) => {
    socket.to(sessionId).emit("ice-candidate", candidate)
  })

  // ✅ FIX 1: remove user from in-memory map on disconnect → no ghost participants
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id)

    if (currentSessionId && currentUserId) {
      const room = sessionParticipants.get(currentSessionId)
      if (room) {
        room.delete(currentUserId)
        const participantsList = Array.from(room.values())

        // notify remaining users
        io.to(currentSessionId).emit("participants-update", participantsList)

        if (room.size === 0) {
          sessionParticipants.delete(currentSessionId)
        }
      }
    }
  })
})

server.listen(PORT, () => {
  console.log(`Session service running on port ${PORT}`)
})

module.exports = server