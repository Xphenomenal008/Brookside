
const podcast=require("../model/podcastmodel")
const Episode=require("../model/Episodemodel")
const cloudinary = require("../config/cloudinary");


 const createpodcast=async(req,res)=>{
  try{
    const{title,description}=req.body
    const creatorId=req.headers["x-user-id"]
    console.log(creatorId)
    if(!creatorId){
      return res.status(401).json({
        message:"unautherized"
      })
    }
    if(!title){
      return res.status(401).json({
        message:"title is required"
      })
    }
    const existingPodcast = await podcast.findOne({ title });

if (existingPodcast) {
  return res.status(409).json({
    message: "Podcast with this title already exists"
  });
}
    
    //we sucessfully created the podcast or we can say folder 
    const podcasty=await podcast.create({
      title,
      description,
      creatorId
    })

    return res.status(201).json({
      sucess:true,
      podcasty
    })

  }catch(e){
    res.status(500).json({
      success:false,
      message:e.message
  });
  }
 }

 const listMypodcasts=async(req,res)=>{
     try{
         const userId=req.headers["x-user-id"]
         if(!userId){
             return res.status(401).json({
                 message:"unautherized"
             })
         }
         const podcasts=await podcast.
         find({creatorId:userId})
         .sort({createdAt:-1})
         return res.status(200).json({
             sucess:true,
             count:podcasts.length,
             podcasts:podcasts
         })
 
 
     }catch(e){
        return res.status(500).json({
             success:false,
             message:e.message,
         })
     }
 
 
 }

 //podcasts from other users.
 const explorepodcasts=async(req,res)=>{
  try{
    const userId=req.headers["x-user-id"]
    if(!userId){
      res.status(403).json({
        success:false,
        message:"unautherized",
      })
    }
    const allpodcasts=await podcast.find({creatorId:{$ne:userId}}).sort({createdAt:-1});
    return res.status(200).json({
      success:true,
      podcasts:allpodcasts
    })

  }catch(e){
    return res.status(500).json({
             success:false,
             message:e.message,
         })

  }

 }

 //get specificpodcast
 const podcastbyid=async(req,res)=>{
  try{
    const {podcastId}=req.params;
    const specificPodcast=await podcast.findOne({_id:podcastId});
    if(!specificPodcast){
      return res.status(404).json({
        success:true,
        message:"no podcast found!"
      })
    }
    return res.status(200).json({
      success:true,
      Podcast:specificPodcast
    })

  }catch(e){
    return res.status(500).json({
      success:false,
      message:e.message
    })
  }
    

 }

 //get episodes from podcastid , list all which comes under one episode
 const listepisodes=async(req,res)=>{
 try{
     const {podcastId}=req.params;
     const episodes=await Episode.find({podcastId}).sort({createdAt:-1})
     if(!episodes){
      return  res.status(404).json({
       success:false,
       message:"no episodes found!"
       })
 }
     return res.status(200).json({
     success:true,
     episodes
     }) 

 }catch(e){
      return res.status(500).json({
      success:false,
      message:e.message
    })
 }
  
 }


 //internal episode creation ...this one is only called by session service on ending the session , acctually we will create a episode draft first
 //later on will upload the audio
 const createepisodefromsession = async (req, res) => {
  console.log("controller reached episode one!!")
  console.log(`this body is from episode ${req.body} `)
  try {
    const { podcastId, sessionId, creatorId } = req.body;

    if (!podcastId || !sessionId || !creatorId) {
      return res.status(400).json({
        message: "podcastId or sessionId or creatorId is missing"
      });
    }

    console.log("episode creation about to start")
    const myepisode = await Episode.create({
      podcastId,
      sessionId,
      creatorId,
      status: "recording"
    });

    console.log("episode creation is finished!")
    return res.status(201).json({
      episodeId: myepisode._id
    });

  } catch (e) {
    console.error("Episode creation error:", e);
    return res.status(500).json({
      message: e.message
    });
  }
};


//this is called actuyally when session ends suncessfully and we can say that we have created episode sucessfully , above one called when episode created first time as draft
const UploadEpisosdeAudio = async (req, res) => {
  try {
    // console.log("🔥 controller hit");
    // console.log("🔥 body:", req.body);
    // console.log("🔥 file:", req.file);
    const {episodeId}=req.body

    if (!req.file) {
      return res.status(400).json({ message: "Audio file is required" });
    }

    // 🔑 UPLOAD BUFFER TO CLOUDINARY
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "podcast-audio",
          resource_type: "video" // REQUIRED for audio
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    const audioUrl = uploadResult.secure_url;
    const myepisode=await Episode.findByIdAndUpdate(episodeId,{
      audioUrl:audioUrl,
      status:"published",
    },
    {new:true}
  )

    return res.status(201).json({
      success: true,
      episodeId:myepisode._id,
      audioUrl:myepisode.audioUrl,
      status:myepisode.status

    });

  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: e.message
    });
  }
};





 module.exports={createpodcast,listMypodcasts,UploadEpisosdeAudio,createepisodefromsession,explorepodcasts,podcastbyid,listepisodes}