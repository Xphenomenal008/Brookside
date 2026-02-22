const express=require("express")
const router=express.Router()
const {createsession, joinsession, getsessioninfo, endsession}=require("../controllers/sessionController")
const uploadAudio=require("../middlewares/uploadAudio")

router.post("/",createsession)
router.post("/:sessionId/join",joinsession)
router.get("/:sessionId",getsessioninfo)
router.post("/:sessionId/end",uploadAudio.single("audio"),endsession)
 
module.exports=router