const User = require("../models/model"); 
const bcrypt = require("bcryptjs");
const genratetokenandsetcookies = require("../utitlites/genratetokenandsetcookies");
const sendOtpMail = require("../utitlites/sendOtpmails");

/* ===================== SIGNUP ===================== */
const functionsignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Basic checks
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // 2. Find existing user
    const existingUser = await User.findOne({ email });

    // 3. If user exists & verified → block
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User already exists and is verified"
      });
    }

    // 4. If user exists but NOT verified → resend OTP
    if (existingUser && !existingUser.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      existingUser.otp = otp;
      existingUser.otpExpiry = Date.now() + 5 * 60 * 1000;
      await existingUser.save();

      await sendOtpMail(email, otp);

      return res.status(200).json({
        success: true,
        message: "OTP resent. Please verify your email."
      });
    }

    // 5. New user → create
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000,
      isVerified: false
    });

    await sendOtpMail(email, otp);

    return res.status(201).json({
      success: true,
      message: "OTP sent to email. Please verify."
    });

  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


/* ===================== Verify otp ===================== */
//when otp is correct we siwll set isverifed true and clear otp fields
const verifyOtp=async(req,res)=>{
  try{
    const {email,otp}=req.body
    const user=await User.findOne({email})
    if(!user){
      return res.status(404).json({message:"user not found"})
    }
    //one important check
    if (user.isVerified) {
  return res.status(400).json({ message: "User already verified" });
}

    if(user.otp!==otp || user.otpExpiry<Date.now()){
      return res.status(400).json({message:"Invalid or expired OTP"})
    }
    user.isVerified=true;
    user.otp=undefined;
    user.otpExpiry=undefined;
    await user.save()
    return res.status(200).json({
      success:true,
      message:"Email verified sucessfully"})

  }catch(e){
    return res.status(500).json({message:"server error!"})
  }

}







/* ===================== LOGIN ===================== */
const functionlogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Presence check
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    //we will also check if user email is verified or not !
    if (!user.isVerified){
      return res.status(403).json({
        success:false,
        message:"please verify the email before logging in"
      })
    }

    // Password compare
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Generate token + set cookie
    const token=genratetokenandsetcookies(user._id, res);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


/* ===================== LOGOUT===================== */
const functionlogout=async(req,res)=>{
      res.clearCookie('token')
      res.status(200).json({
        success:true,
        message:"user logged out sucessfully!!"
      })
      
}

/* ===================== resend-OTP ===================== */


const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User already verified"
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save();
    await sendOtpMail(email, otp);

   return res.status(200).json({
      success: true,
      message: "OTP resent successfully"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// actually everytime our website got refresh we are sending the token from localstroge of frontend to the backend to verify
//if this user real,and storing that user info automatically in frontend
const verifyme = async (req, res) => {
    try {
        // 1. Get the ID from the header forwarded by the Gateway
        const userId = req.headers["x-user-id"];

        // 2. Check if the ID actually exists
        if (!userId || userId === "undefined") {
            return res.status(401).json({ 
                success: false, 
                message: "User ID not found in headers. Gateway proxy might be misconfigured." 
            });
        }

        // 3. Database lookup
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User no longer exists in database" 
            });
        }

        // 4. Return the user object to React
        res.status(200).json(user);

    } catch (error) {
        console.error("VERIFYME ERROR:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error during verification" 
        });
    }
};




/* ===================== EXPORT ===================== */
module.exports = {
  functionsignup,
  functionlogin,
  functionlogout,
  verifyOtp,
  resendOtp,
  verifyme
};
