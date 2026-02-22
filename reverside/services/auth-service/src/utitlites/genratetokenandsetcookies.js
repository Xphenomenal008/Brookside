const jwt=require("jsonwebtoken")
const genratetokenandsetcookies=(userid,res)=>{
const token=jwt.sign(
    {userId:userid},//user id of the user
    process.env.JWT_SECRET, //secret
    {expiresIn:"7d"} //expiresIn
)
res.cookie("token", token, {
  httpOnly: true,
  secure: false,        
  sameSite: "lax",      
  maxAge: 7 * 24 * 60 * 60 * 1000
});

return token

}
module.exports=genratetokenandsetcookies