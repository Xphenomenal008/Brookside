express=require("express")
router=express.Router()
const { functionlogin, functionsignup, functionlogout, verifyOtp, resendOtp }=require("../controllers/authcontroller")

router.post("/signup",functionsignup)
router.post("/login",functionlogin)
router.post("/logout",functionlogout)
router.post("/verifyemail",verifyOtp)
router.post("/resendotp",resendOtp)
// router.post("/logout",functionlogout)
module.exports=router