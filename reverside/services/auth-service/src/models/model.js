const { default: mongoose } = require('mongoose')

const userSchema=mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    otp: String,
    otpExpiry:Date,
    isVerified:{
        type:Boolean,
        default:false
    }
},
{timestamps:true}
);
module.exports=mongoose.model("User",userSchema)