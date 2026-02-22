const mongoose=require("mongoose")
const sessionSchema=mongoose.Schema({
    podcastId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'Podcast'
    },
    episodeId:{
        //so that session knows to which episode it belongs to
         type:mongoose.Schema.Types.ObjectId
    },
    hostId:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:["waiting","ended","live"],
        default:"waiting"
    },
    participants:[{
        userid:String,
        joinedAt:Date
    }]

})
module.exports=mongoose.model("Session",sessionSchema)