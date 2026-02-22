const mongoose = require("mongoose");

const podcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: String,
    creatorId: { //id that is comming from auth service when user logged in.
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Podcast", podcastSchema);
