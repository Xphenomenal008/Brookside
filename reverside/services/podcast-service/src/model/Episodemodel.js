const mongoose = require("mongoose");

const episodeSchema = new mongoose.Schema(
  {
    podcastId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Podcast",
      required: true
    },
    sessionId:{
      type:mongoose.Schema.Types.ObjectId,
    },
    
    creatorId:{
      type:mongoose.Schema.Types.ObjectId,
      required:true
    },
    title: {
      type: String,
      default:"untitled episode"
    },
    description: {
      type: String,
      default:""
    },
    audioUrl: {
      type: String,   //since first we create a draft of episode automatically  on ending session ,later we will upload the audio
    },
    duration: {
      type: Number
    },
    status:{
      type:String,
      enum:["draft","recording","published"],
      default:"draft"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Episode", episodeSchema);
