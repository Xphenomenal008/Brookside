const Session = require("../model/sessionModel")
const FormData = require("form-data")
const axios = require("axios")

const createsession = async (req, res) => {
  try {
    const { podcastId } = req.body
    const hostId = req.userId || req.headers["x-user-id"]

    const oursession = await Session.create({ podcastId, hostId, status: "live" })

    const responsek = await axios.post(
      `${process.env.PODCAST_SERVICE}/podcasts/fromSession`,
      { podcastId, sessionId: oursession._id, creatorId: hostId },
      {
        headers: { "x-internal-key": process.env.INTERNAL_KEY },
        validateStatus: () => true
      }
    )

    if (responsek.status !== 201) {
      return res.status(500).json({ message: "Episode service error", data: responsek.data })
    }

    oursession.episodeId = responsek.data.episodeId
    await oursession.save()

    return res.status(201).json({ sessionId: oursession._id, episodeId: oursession.episodeId })

  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}


const joinsession = async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId = req.headers["x-user-id"]
    const userName = req.headers["x-user-name"] || "User"

    if (!sessionId) {
      return res.status(400).json({ message: "session not specified" })
    }

    const mysession = await Session.findOne({ _id: sessionId })

    if (!mysession) {
      return res.status(404).json({ success: false, message: "no such session exists!" })
    }

    if (mysession.status === "ended") {
      return res.status(400).json({ success: false, message: "session has ended!" })
    }

    // ✅ FIX 1: check for duplicate before pushing
    const alreadyThere = mysession.participants.some((p) => p.userId === userId)

    if (alreadyThere) {
      // ✅ return early — do NOT fall through (was missing return before)
      return res.status(200).json({ success: true, message: "already in session" })
    }

    mysession.participants.push({ userId, userName, joinedAt: new Date() })
    await mysession.save()

    return res.status(201).json({ success: true, message: "joined session!" })

  } catch (e) {
    return res.status(500).json({ success: false, message: e.message })
  }
}


const getsessioninfo = async (req, res) => {
  try {
    const { sessionId } = req.params

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "please specify sessionId" })
    }

    const mysession = await Session.findOne({ _id: sessionId })

    if (!mysession) {
      return res.status(404).json({ success: false, message: "no session found" })
    }

    return res.status(200).json({ success: true, mysession })

  } catch (e) {
    return res.status(500).json({ success: false, message: e.message })
  }
}


const endsession = async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId = req.headers["x-user-id"]

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "please specify sessionId" })
    }

    const mysession = await Session.findOne({ _id: sessionId })

    if (!mysession) {
      return res.status(404).json({ success: false, message: "no session found" })
    }

    if (userId !== mysession.hostId.toString()) {
      return res.status(403).json({ success: false, message: "unauthorized" })
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "audio file required" })
    }

    mysession.status = "ended"
    await mysession.save()

    const formdata = new FormData()
    formdata.append("episodeId", mysession.episodeId.toString())
    formdata.append("audio", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    })

    const responsel = await axios.post(
      `${process.env.PODCAST_SERVICE}/podcasts/uploadepisodeaudio`,
      formdata,
      {
        headers: { ...formdata.getHeaders(), "x-internal-key": process.env.INTERNAL_KEY },
        maxBodyLength: Infinity,
      }
    )

    return res.status(200).json({
      success: true,
      message: "session ended successfully",
      sessionId: mysession._id,
      audioUrl: responsel.data.audioUrl,
      episodeId: responsel.data.episodeId,
    })

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { createsession, joinsession, getsessioninfo, endsession }