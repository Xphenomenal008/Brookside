const Session = require("../model/sessionModel")
const FormData = require("form-data")
const axios = require("axios")

const createsession = async (req, res) => {
  try {
    const { podcastId } = req.body
    const hostId = req.userId || req.headers["x-user-id"]

    const oursession = await Session.create({
      podcastId,
      hostId,
      status: "live"
    })

    const episodeCreateUrl = `${process.env.PODCAST_SERVICE}/podcasts/fromSession`

    const responsek = await axios.post(
      episodeCreateUrl,
      { podcastId, sessionId: oursession._id, creatorId: hostId },
      {
        headers: { "x-internal-key": process.env.INTERNAL_KEY },
        validateStatus: () => true
      }
    )

    if (responsek.status !== 201) {
      return res.status(500).json({
        message: "Episode service error",
        status: responsek.status,
        data: responsek.data
      })
    }

    oursession.episodeId = responsek.data.episodeId
    await oursession.save()

    return res.status(201).json({
      sessionId: oursession._id,
      episodeId: oursession.episodeId
    })

  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}


const joinsession = async (req, res) => {
  try {
    const { sessionId } = req.params
    const userId = req.headers["x-user-id"]
    const userName = req.headers["x-user-name"] || "User"  // ✅ grab name from header

    if (!sessionId) {
      return res.status(400).json({ message: "session not created!" })
    }

    const mysession = await Session.findOne({ _id: sessionId })

    if (!mysession) {
      return res.status(404).json({ success: false, message: "no such session exists!" })
    }

    if (mysession.status === "ended") {
      return res.status(400).json({ success: false, message: "session has ended!" })
    }

    const alreadyThere = mysession.participants.some((p) => p.userId === userId)

    if (alreadyThere) {
      return res.status(200).json({   // ✅ return (was missing!) + 200 so frontend doesn't error
        success: true,
        message: "user already in session"
      })
    }

    mysession.participants.push({
      userId,
      userName,             // ✅ save name alongside userId
      joinedAt: new Date()
    })

    await mysession.save()

    return res.status(201).json({
      success: true,
      message: "new user added to the session!"
    })

  } catch (e) {
    return res.status(500).json({ status: false, message: e.message })
  }
}


const getsessioninfo = async (req, res) => {
  try {
    const { sessionId } = req.params

    if (!sessionId) {
      return res.status(401).json({ success: false, message: "please specify sessionId" })
    }

    const mysession = await Session.findOne({ _id: sessionId })

    if (!mysession) {
      return res.status(404).json({ success: false, message: "no session found" })
    }

    return res.status(200).json({ success: true, mysession })

  } catch (e) {
    return res.status(500).json({ status: false, message: e.message })
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
      return res.status(403).json({ success: false, message: "unauthorized from session!" })
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
      contentType: req.file.mimetype
    })

    const Url = `${process.env.PODCAST_SERVICE}/podcasts/uploadepisodeaudio`
    const responsel = await axios.post(Url, formdata, {
      headers: {
        ...formdata.getHeaders(),
        "x-internal-key": process.env.INTERNAL_KEY
      },
      maxBodyLength: Infinity
    })

    return res.status(200).json({
      success: true,
      message: "session ended successfully",
      sessionId: mysession._id,
      audioUrl: responsel.data.audioUrl,
      episodeId: responsel.data.episodeId,
      status: responsel.data.status
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "end session failed",
      error: error.message
    })
  }
}

module.exports = { createsession, joinsession, getsessioninfo, endsession }