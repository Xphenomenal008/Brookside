const multer = require("multer");
 
const uploadAudio = multer({
  storage: multer.memoryStorage()
});

module.exports = uploadAudio;

 
