const Session=require("../model/sessionModel")
const FormData = require("form-data");
const axios = require("axios");
const {Readable}=require("stream")

//after podcast that is our folder , we create this session in which then other users are invited and then they joined.
//and after this we will create episode later

 
const createsession = async (req, res) => {
  try {
    const { podcastId } = req.body;
    const hostId = req.userId || req.headers["x-user-id"];

    console.log("🟢 CREATE SESSION START");
    console.log("podcastId:", podcastId);
    console.log("hostId:", hostId);

    const oursession = await Session.create({
      podcastId,
      hostId,
      status: "live"
    });

    console.log("🟢 SESSION CREATED:", oursession._id);

    const episodeCreateUrl = `${process.env.PODCAST_SERVICE}/podcasts/fromSession`;

    console.log("➡️ CALLING EPISODE SERVICE");
    console.log("URL:", episodeCreateUrl);
    console.log("PAYLOAD:", {
      podcastId,
      sessionId: oursession._id,
      creatorId: hostId
    });
    console.log("INTERNAL KEY:", process.env.INTERNAL_KEY);

    // 🔥 IMPORTANT PART
    const responsek = await axios.post(
      episodeCreateUrl,
      {
        podcastId,
        sessionId: oursession._id,
        creatorId: hostId
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_KEY
        },
        validateStatus: () => true // 👈 DO NOT REMOVE
      }
    );

    console.log("⬅️ EPISODE SERVICE STATUS:", responsek.status);
    console.log("⬅️ EPISODE SERVICE DATA:", responsek.data);

    if (responsek.status !== 201) {
      console.log("❌ EPISODE CREATION FAILED");
      return res.status(500).json({
        message: "Episode service error",
        status: responsek.status,
        data: responsek.data
      });
    }

    oursession.episodeId = responsek.data.episodeId;
    await oursession.save();

    console.log("✅ SESSION + EPISODE LINKED");

    return res.status(201).json({
      sessionId: oursession._id,
      episodeId: oursession.episodeId
    });

  } catch (e) {
    console.log("❌ CREATE SESSION ERROR");
    console.log(e.message);

    return res.status(500).json({
      message: e.message
    });
  }
};



//actually this is the invite link , when other user click this link he will be added to the session
//this is for other user , it use to track which other users also there in our session
const joinsession=async(req,res)=>{
    try{
        const {sessionId}=req.params
        const userId=req.headers["x-user-id"]
        if(!sessionId){
            res.status(400).json({
                message:"session not created! "
            })
        }
         const mysession=await Session.findOne({_id:sessionId})
         if (!mysession ){
           return  res.status(404).json({
                sucess:false,
                message:"no such session exists!"
            })
         }
         if (mysession.status==="ended"){
            return  res.status(400).json({
                sucess:false,
                message:"session has ended!"
            })

         }

         const alredythere= await mysession.participants.some((user)=>user.userid==userId)
         if(alredythere){
            res.status(401).json({
                sucess:false,
                message:"this user is already in the seesion"
            })
         }

        mysession.participants.push({
            userid:userId,
            joinedAt:new Date()
            
         })
          await mysession.save()
         res.status(201).json({
            sucess:true,
            message:"new user added to the session!"
         })

    }catch(e){
        return res.status(500).json({
            status:false,
           message: e.message
        })
        
    }


    }


    //frontend also want list of candidates in aparticular session
    const getsessioninfo=async(req,res)=>{
        try {
                    const {sessionId}=req.params
        if(!sessionId){
           return res.status(401).json({
                sucess:false,
                message:"please specify sessionid"
            })
        }
        const mysession=await Session.findOne({_id:sessionId})
        if(!mysession){
            return res.status(404).json({
                sucess:false,
                message:"no session found"
            })
        }
        return res.status(200).json({
            sucess:true,
            mysession
        })
        } catch (e) {
            return res.status(500).json({
            status:false,
           message: e.message
        })
            
        }


    }

    //this is actually a second core functinality of our webapp
    //this trigger by host only , to end the session and after this we automatically create the episode


const endsession = async (req, res) => {
  console.log("\n========== END SESSION HIT ==========");

  try {
    // 1️⃣ PARAMS & HEADERS
    const { sessionId } = req.params;
    const userId = req.headers["x-user-id"];

    console.log("PARAM sessionId:", sessionId);
    console.log("HEADER userId:", userId);

    if (!sessionId) {
      console.log("❌ sessionId missing");
      return res.status(400).json({
        success: false,
        message: "please specify sessionId",
      });
    }

    // 2️⃣ FIND SESSION
    const mysession = await Session.findOne({ _id: sessionId });

    console.log("SESSION FOUND:", !!mysession);

    if (!mysession) {
      console.log("❌ no session found in DB");
      return res.status(404).json({
        success: false,
        message: "no session found",
      });
    }

    console.log("SESSION hostId:", mysession.hostId.toString());

    // 3️⃣ AUTH CHECK
    if (userId !== mysession.hostId.toString()) {
      console.log("❌ AUTH FAILED");
      console.log("userId:", userId);
      console.log("hostId:", mysession.hostId.toString());

      return res.status(403).json({
        success: false,
        message: "unauthorized from session!",
      });
    }

    console.log("✅ AUTH PASSED");

    // 4️⃣ FILE CHECK
    console.log("REQ.FILE EXISTS:", !!req.file);

    if (!req.file) {
      console.log("❌ req.file missing");
      return res.status(400).json({
        success: false,
        message: "audio file required",
      });
    }

    // console.log("FILE originalname:", req.file.originalname);
    // console.log("FILE mimetype:", req.file.mimetype);
    // console.log("FILE size:", req.file.size);
    // console.log("FILE buffer length:", req.file.buffer?.length);

    // 5️⃣ UPDATE SESSION
    mysession.status = "ended";
    await mysession.save();
    // console.log("✅ SESSION MARKED AS ENDED");

    // 6️⃣ BUILD FORMDATA
    const formdata = new FormData();

    formdata.append("episodeId", mysession.episodeId.toString());
    // console.log("FORMDATA episodeId:", mysession.episodeId.toString());

    formdata.append("audio", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // console.log("FORMDATA audio appended");

    // 7️⃣ INTERNAL API CALL
    console.log("➡️ CALLING PODCAST SERVICE...");
    const Url = `${process.env.PODCAST_SERVICE}/podcasts/uploadepisodeaudio`
    const responsel = await axios.post(
      Url,
      formdata,
      {
        headers: {
          ...formdata.getHeaders(),
          "x-internal-key": process.env.INTERNAL_KEY,
        },
        maxBodyLength: Infinity,
      }
    );
     

    console.log("⬅️ PODCAST RESPONSE STATUS:", responsel.status);
    console.log("⬅️ PODCAST RESPONSE DATA:", responsel.data);

    // 8️⃣ FINAL RESPONSE
    return res.status(200).json({
      success: true,
      message: "session ended successfully",
      sessionId: mysession._id,
      audioUrl:responsel.data.audioUrl,
      episodeId:responsel.data.episodeId,
      status:responsel.data.status
    });

  } catch (error) {
    console.log("🔥 END SESSION ERROR 🔥");

    console.log("ERROR message:", error.message);
    console.log("ERROR response:", error.response?.data);
    console.log("ERROR status:", error.response?.status);
    console.log("ERROR stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: "end session failed",
      error: error.message,
    });
  }
};

module.exports={createsession,joinsession,getsessioninfo,endsession}