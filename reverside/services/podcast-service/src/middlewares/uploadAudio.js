const multer = require("multer");
 
const uploadAudio = multer({
  storage: multer.memoryStorage(),
    limits:{fieldSize:100*1024*1024}
});

module.exports = uploadAudio;

 
