express=require("express")
router=express.Router()
const {createpodcast,listMypodcasts,createepisodefromsession, UploadEpisosdeAudio}=require("../controllers/podcastcontroller")
const uploadAudio=require("../middlewares/uploadAudio")
const internalAuth=require("../middlewares/internalAuth")

router.post("/",createpodcast)
router.get("/",listMypodcasts)

//we used internalauth middleware to ensure that this request is comming from right service internally
//session end route will call this from session service when session actually ends to upload comming audio
router.post("/uploadepisodeaudio",internalAuth,uploadAudio.single("audio"),UploadEpisosdeAudio)

//this also called internally by session service on the time of first time of creating session, as a draft , when audio will be uploded our episode will fully created!!
router.post("/fromSession",internalAuth,
    (req,res,next)=>{
        console.log("hit create episode")
        next()
    }
    ,createepisodefromsession)

//     router.post("/_ping", (req, res) => {
//   console.log("🔥🔥 SESSION HIT PODCAST DUMMY ROUTE");
//   console.log("BODY:", req.body);
//   console.log("HEADERS:", req.headers);

//   return res.status(200).json({
//     ok: true,
//     message: "podcast service reachable from session"
//   });
// });

module.exports=router